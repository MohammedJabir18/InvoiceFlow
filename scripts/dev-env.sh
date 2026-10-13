#!/usr/bin/env bash
# Source this file from any directory to select the documented development tools.
_invoiceflow_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
_invoiceflow_node_version="$(cat "$_invoiceflow_root/.nvmrc")"
_invoiceflow_node_bin="$HOME/.local/share/invoiceflow-toolchains/node-v${_invoiceflow_node_version}-linux-x64/bin"
if [[ -x "$_invoiceflow_node_bin/node" ]]; then
  export PATH="$_invoiceflow_node_bin:$PATH"
fi
export PATH="$HOME/.bun/bin:$HOME/.cargo/bin:$PATH"
unset _invoiceflow_root _invoiceflow_node_version _invoiceflow_node_bin
