{{/*

Template design:

- This file generates a title followed by zero or more sections.
- The title, and each section, are designed under the assumption that it is the
  last page element, and so does not add extra trailing newlines.
- Each section, other than the first, shall introduce a separator line.

*/ -}}

# {{ .Title | strings.TrimSpace }}
{{ $needSeparator := false -}}

{{ with .Description | strings.TrimSpace }}
> {{ replace . "\n" "\n> " }}
{{ $needSeparator = true -}}
{{ end -}}

{{ with (partialCached "td/root-page.html" site).OutputFormats.Get "LLMS" }}
{{- if $needSeparator }}
---
{{ end }}
Site [llms.txt]( {{- .RelPermalink -}} )
{{ $needSeparator = true -}}
{{ end -}}

{{ with .RenderShortcodes | strings.TrimSpace }}
{{- if $needSeparator }}
---
{{ end }}
{{ . }}
{{ $needSeparator = true -}}
{{ end -}}

{{ with .Pages }}
{{- if $needSeparator }}
---
{{ end }}
Section pages:

{{ range . -}}
- [ {{- .Title | strings.TrimSpace -}} ]( {{- .RelPermalink -}} )
  {{- with .Description | strings.TrimSpace -}}
    : {{ . -}}
  {{ end }}
{{ end -}}

{{ end -}}
