#!/bin/bash
# cSpell:ignore themesdir oneline
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DEPS=""
DOCSY_REPO_DEFAULT="docsy/docsy"
DOCSY_REPO=$DOCSY_REPO_DEFAULT
DOCSY_VERS=""
DOCSY_SRC="NPM"
FORCE_DELETE=false
# No fallback when the repo install is absent; bare-npx rationale:
# tests/runner-lint.test.mjs. Exported for the scaffolded site's hugo
# script (see _npm_install).
: "${HUGO:=$SCRIPT_DIR/../node_modules/.bin/hugo}"
export HUGO
SITE_NAME="test-site"
THEMESDIR="node_modules"
VERBOSE=1
OUTPUT_REDIRECT=""

function _usage() {
  cat <<EOS
Usage: `basename $0` [options]

  Creates a Docsy-themed site under SITE_NAME using the Hugo new command.
  Docsy is fetched as an NPM package from $DOCSY_REPO in GitHub,
  unless the -l or -s HUGO_MOD flags are used.

  -f            Force delete SITE_NAME if it exists before recreating it
  -h            Output this usage info
  -l PATH       Use local Docsy from PATH: an installed checkout (theme
                dependencies present, e.g. via npm run install:safe).
                Default: '$THEMESDIR'
  -n SITE_NAME  Name of directory to create for the Hugo generated site.
                Default: '$SITE_NAME'
  -q            Run a bit more quietly.
  -r REPO       GitHub org+repo to fetch Docsy from.
                Format: GITHUB_USER/DOCSY_REPO. Default: $DOCSY_REPO_DEFAULT
  -s MOD_OR_PKG Docsy source: from a Hugo module or NPM package named '$DOCSY_REPO', where
                MOD_OR_PKG is NPM or HUGO_MODULE (HUGO for short). Default: $DOCSY_SRC
  -v VERS       Docsy Hugo module or NPM package version. Default: '$DOCSY_VERS'.
                Examples for Hugo modules: v1.1.1, some-branch-name
                Examples for NPM: semver:1.1.1, some-branch-name

EOS
}

function usage() {
  local status=${1:-0}
  _usage 1>&2
  exit $status
}

function process_CLI_args() {
  while getopts ":fhl:n:qr:s:v:" opt; do
    case $opt in
      f)
        FORCE_DELETE=true
        ;;
      h)
        usage
        ;;
      l)
        DOCSY_SRC="LOCAL"
        THEMESDIR="$OPTARG"
        ;;
      n)
        SITE_NAME="$OPTARG"
        ;;
      q)
        VERBOSE=""
        OUTPUT_REDIRECT="> /dev/null 2>&1"
        ;;
      r)
        DOCSY_REPO="$OPTARG"
        ;;
      s)
        DOCSY_SRC=$(echo "$OPTARG" | tr '[:lower:]' '[:upper:]')
        if [[ $DOCSY_SRC != "NPM" && $DOCSY_SRC != HUGO* ]]; then
          echo "ERROR: invalid argument to -s flag: $OPTARG"
          usage 1;
        fi
        ;;
      v)
        DOCSY_VERS="$OPTARG"
        ;;
      \?)
        echo "ERROR: unrecognized flag: -$OPTARG"
        usage 1;
        ;;
    esac
  done

  shift $((OPTIND-1))
  if [ "$#" -gt 0 ]; then
    echo "ERROR: extra argument(s): $*" >&2
    usage 1;
  fi
}

function create_site_directory() {
  if [ -e "$SITE_NAME" ]; then
    if [ "$FORCE_DELETE" = true ]; then
      echo "[INFO] Directory '$SITE_NAME' already exists. Deleting it as requested (-f)."
      ([[ $VERBOSE ]] && set -x; rm -rf "$SITE_NAME")
    else
      echo "[ERROR] Directory '$SITE_NAME' already exists. Remove it or use -f to force delete."
      exit 1
    fi
  fi
}

function _npm_install() {
  npm init -y > /dev/null
  # npm silently ignores config keys it doesn't know (min-release-age on
  # older npm), which would drop the release cooldown; refuse rather than
  # degrade. The floor is read from the repo manifest, its one home.
  npm pkg set "engines.npm=$(node -p 'require(process.argv[1]).engines.npm' "$SCRIPT_DIR/../package.json")" > /dev/null
  # Consumer-simulation installs are unlocked by design, but script-free:
  # Docsy declares no install hooks and none of these deps needs install
  # scripts. Pin that for the site's own installs, plus a registry-release
  # cooldown; the command also carries --ignore-scripts so higher-precedence
  # ambient config can't weaken the policy. script-shell keeps the hugo
  # script's $HUGO expansion working on Windows (Git Bash, per the repo's
  # own .npmrc doctrine).
  printf 'engine-strict=true\nignore-scripts=true\nmin-release-age=7\nscript-shell=bash\n' > .npmrc
  # HUGO_MODULE sites get Bootstrap and Font Awesome from the theme via
  # `hugo mod npm pack` (see below). Non-RTL sites need no PostCSS toolchain.
  if [[ "$DOCSY_SRC" != HUGO* ]]; then
    npm install --ignore-scripts --omit dev --save $DEPS
  fi
  if [[ "$DOCSY_SRC" == "NPM" ]]; then
    # No install hook fetches the theme's runtime deps; run the documented
    # command explicitly. The .npmrc above doesn't reach this leg (--prefix
    # re-roots npm's project config at the installed package), so the command
    # carries its protections inline: lock-exact npm ci with --ignore-scripts.
    npm run --prefix "$THEMESDIR/docsy" install:theme-deps
  fi
  # The theme's dartsass transpiler needs the sass CLI on Hugo's PATH; the
  # site provides it, mirroring the documented consumer setup for every
  # Docsy source. Runs after the --omit=dev install above, which would
  # prune it. Pinned to the repo's tested version, read from its manifest
  # (the pin's one home); an empty read would silently install latest
  # (set -e can't see a failure inside an argument), so guard it.
  sass_version=$(node -p 'require(process.argv[1]).devDependencies["sass-embedded"]' "$SCRIPT_DIR/../package.json")
  [[ "$sass_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+[A-Za-z0-9.+-]*$ ]] || { echo "ERROR: exact sass-embedded pin not found in the repo manifest (got: '$sass_version')" >&2; exit 1; }
  npm install --ignore-scripts --no-audit --no-fund --save-dev "sass-embedded@$sass_version"
  # The documented hugo passthrough script, with one harness twist: hugo is
  # the borrowed repo binary ($HUGO, expanded by the script shell at run
  # time), not a bare name. A name lookup would need the repo's bin dir on
  # PATH, whose sass could then mask a missing site compiler.
  npm pkg set 'scripts.hugo="$HUGO"'
}

function set_up_and_cd_into_site() {
  $HUGO new site --format yaml --quiet "$SITE_NAME"
  cd "$SITE_NAME"
  eval _npm_install $OUTPUT_REDIRECT

  if [[ "$DOCSY_SRC" == HUGO* ]]; then
    _set_up_site_using_hugo_modules
  else
    echo "theme: docsy/theme" >> hugo.yaml
    echo "themesDir: $THEMESDIR" >> hugo.yaml
  fi
}

function _set_up_site_using_hugo_modules() {
  local user_name=$(whoami)

  HUGO_MOD_WITH_VERS="$DOCSY_REPO/theme"
  if [[ -n $DOCSY_VERS ]]; then
    HUGO_MOD_WITH_VERS+="@$DOCSY_VERS"
  fi

  echo "[INFO] Getting Docsy as Hugo module $HUGO_MOD_WITH_VERS"

  eval "$HUGO mod init github.com/$user_name/$SITE_NAME" $OUTPUT_REDIRECT

  if [[ "$DOCSY_REPO" == "$DOCSY_REPO_DEFAULT" ]]; then
    eval "$HUGO mod get github.com/$HUGO_MOD_WITH_VERS" $OUTPUT_REDIRECT
  else
    echo "[INFO] Fetch Docsy GitHub repo '$DOCSY_REPO' @ '$DOCSY_VERS'"
    mkdir tmp
    local BRANCH_SPEC=""
    local DEPTH=10
    local SWITCH_NEEDED=
    local CLONE="git clone --depth=$DEPTH https://github.com/$DOCSY_REPO tmp/docsy"
    if [[ -n $DOCSY_VERS ]]; then
      BRANCH_SPEC="-b $DOCSY_VERS"
    fi
    if ! $CLONE $BRANCH_SPEC; then
      SWITCH_NEEDED=1
      $CLONE
    fi
    ( \
      cd tmp/docsy && \
      git log --oneline -$DEPTH && \
      if [[ -n $SWITCH_NEEDED ]]; then git switch --detach $DOCSY_VERS; fi \
    )
    echo "replace github.com/$DOCSY_REPO_DEFAULT/theme => ./tmp/docsy/theme" >> go.mod
    eval "$HUGO mod get github.com/$DOCSY_REPO_DEFAULT/theme" $OUTPUT_REDIRECT
  fi

  echo "module: {proxy: direct, hugoVersion: {extended: true}, imports: [{path: github.com/$DOCSY_REPO_DEFAULT/theme, disable: false}]}" >> hugo.yaml

  # Consolidate the theme's declared npm deps into this project's workspace,
  # then install them script-free: none of these deps needs install scripts.
  eval "$HUGO mod npm pack" $OUTPUT_REDIRECT
  eval "npm install --ignore-scripts --no-audit --no-fund" $OUTPUT_REDIRECT
}

function main() {
  process_CLI_args "$@"
  create_site_directory

  if [[ "$DOCSY_SRC" == "NPM" ]]; then
    NPM_PKG=$DOCSY_REPO
    if [[ -n $DOCSY_VERS ]]; then
      NPM_PKG+="#$DOCSY_VERS"
    fi
    echo "[INFO] Getting Docsy as NPM package '$NPM_PKG'"
    DEPS+=" $NPM_PKG"
  elif [[ "$DOCSY_SRC" == "LOCAL" ]]; then
    echo "[INFO] Getting Docsy through a local directory '$THEMESDIR'"
  fi

  [[ $VERBOSE ]] && set -x
  set_up_and_cd_into_site
  eval npm run hugo $OUTPUT_REDIRECT
  [[ $VERBOSE ]] && set +x
  cd ..

  echo "[INFO] '$SITE_NAME' successfully created, set up, and built."

  if [[ $VERBOSE ]]; then
    echo "[INFO] Here are the site files:"
    echo
    set -x
    ls -l "$SITE_NAME"
    echo
    ls -l "$SITE_NAME/public"
  fi
}

main "$@"
