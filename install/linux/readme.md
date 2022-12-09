Installation
===

To make Treefrog available on the command line as `edita`, modify `edita` in this folder to point to the correct location (replace `/path/to/edita` with wherever you've cloned the repo) and copy it to somewhere on your PATH, e.g. `~/bin`.

To get it registered as an application (so you can set file types to open with it etc), modify the `edita.desktop` file:

- update the `Exec` line to point to wherever you copied `edita` to in the previous step, e.g. `/home/[username]/bin/edita`

- update the `Icon` line to point to the correct location (again wherever you've cloned the repo to)

Then copy it to `~/.local/share/applications`.
