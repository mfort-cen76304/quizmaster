for _f in ./.env ../.env; do [ -f "$_f" ] && . "$_f" && break; done
: ${BE_PORT:=8080}
: ${FE_PORT:=5173}
