{{/*

Template design:

- This file generates a title followed by zero or more sections.
- The title, and each section, are designed under the assumption that it is the
  last page element, and so does not add extra trailing newlines.
- Each section, other than the first, shall introduce a separator line.

*/ -}}

# {{ .Title | strings.TrimSpace -}}

{{ $needSeparator := false -}}

{{/* Description ------------------------------------------------------- */ -}}

{{ with .Description | strings.TrimSpace }}

> {{ replace . "\n" "\n> " -}}
{{ $needSeparator = true -}}
{{ end -}}

{{/* Site index -------------------------------------------------------- */ -}}

{{ with (partialCached "root-page.html" site site.Language.Lang).OutputFormats.Get "LLMS" }}
{{ if $needSeparator }}
---

{{ else }}
{{ end -}}

LLMS index: [llms.txt]( {{- .RelPermalink -}} )
{{ $needSeparator = true -}}
{{ end -}}

{{/* Page content ------------------------------------------------------ */ -}}

{{ with .RenderShortcodes | strings.TrimSpace -}}
{{ if $needSeparator }}
---

{{ else }}
{{ end -}}

{{ . }}
{{ $needSeparator = true -}}
{{ end -}}

{{/* Section index, if any --------------------------------------------- */ -}}

{{ with .Pages -}}

{{ if $needSeparator }}
---

{{ else }}
{{ end -}}

Section pages:

{{ range . -}}
- [ {{- .Title | strings.TrimSpace -}} ]( {{- .RelPermalink -}} )
  {{- with .Description | strings.TrimSpace -}}
    : {{ . -}}
  {{ end }}
{{ end -}}

{{ end -}}
