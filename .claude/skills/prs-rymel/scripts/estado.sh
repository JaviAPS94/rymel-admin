#!/usr/bin/env bash
# Estado de una rama en todos los repos de Rymel, para decidir en cuáles abrir PR.
# Uso: estado.sh [rama]   (por omisión, la rama actual de project-admin)
# Solo lee: hace `git fetch` y consulta gh; no empuja ni crea nada.
set -uo pipefail

RAIZ="${RYMEL_ROOT:-/Users/alex.pinaida/Resplados/Code/Rymel}"
REPOS=(
  "$RAIZ/rymel-design-template"
  "$RAIZ/rymel-formula-engine"
  "$RAIZ/rymel-ui"
  "/Users/alex.pinaida/Documents/ProyectoElectrico/secure-function-engine/secure-function-engine-api"
  "$RAIZ/project-back"
  "$RAIZ/project-admin"
  "$RAIZ/project-front"
)
RAMA="${1:-$(git -C "$RAIZ/project-admin" branch --show-current)}"
echo "Rama: $RAMA"
echo

for repo in "${REPOS[@]}"; do
  nombre=$(basename "$repo")
  if [ ! -d "$repo/.git" ]; then echo "## $nombre — NO ENCONTRADO en $repo"; echo; continue; fi
  git -C "$repo" fetch --quiet origin 2>/dev/null
  slug=$(git -C "$repo" remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')
  base=$(git -C "$repo" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##')
  [ -z "$base" ] && base=$(gh repo view "$slug" --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null)
  actual=$(git -C "$repo" branch --show-current)
  sucio=$(git -C "$repo" status --porcelain | wc -l | tr -d ' ')

  echo "## $nombre ($slug) — base: $base, rama actual: $actual, cambios sin commit: $sucio"
  if ! git -C "$repo" rev-parse --verify --quiet "refs/heads/$RAMA" >/dev/null; then
    echo "   sin rama local «${RAMA}» → no aplica"; echo; continue
  fi
  adelante=$(git -C "$repo" rev-list --count "origin/$base..$RAMA")
  atras=$(git -C "$repo" rev-list --count "$RAMA..origin/$base")
  if git -C "$repo" rev-parse --verify --quiet "refs/remotes/origin/$RAMA" >/dev/null; then
    sin_push=$(git -C "$repo" rev-list --count "origin/$RAMA..$RAMA")
    remoto="en origin, $sin_push commit(s) sin empujar"
  else
    remoto="no existe en origin"
  fi
  pr=$(gh pr list -R "$slug" --head "$RAMA" --state all --json number,state,url \
        -q '.[] | "#\(.number) \(.state) \(.url)"' 2>/dev/null | head -1)
  echo "   $adelante commit(s) por delante de $base, $atras por detrás; rama $remoto"
  echo "   PR: ${pr:-ninguno}"
  if [ "$adelante" -gt 0 ]; then
    git -C "$repo" log --format='   · %h %s' "origin/$base..$RAMA" | head -20
  fi
  echo
done
