# boga
Online BoardGame

```
mkdir -p local/https
openssl -newkey rsa:2048 -new -x509 -nodes -days 365 -keyout local/https/ca.key -out local/https/ca.crt

# No Auth:
BOGA_DEBUG=1 BOGA_HTTPS=./local/https BOGA_HOST=0.0.0.0 BOGA_PORT=443 node ./server/index.js boga
# use any username with any password to login
# notice: Google Chrome requires HTTPS to enable getUserMedia
#         if want testing over HTTP, use Firefox and remove `BOGA_HTTPS`

# Password Auth
mkdir -p local/auth
BOGA_DEBUG=1 BOGA_HTTPS=./local/https BOGA_HOST=0.0.0.0 BOGA_PORT=443 BOGA_PASS_DIR=./local/auth node ./server/index.js boga
echo password > local/auth/user1
# use user1/password to login

# visit https://127.0.0.1/#roomname
# if do not specify room name, audio control will hide
```

### Extra Game

`BOGA_EXTRA_GAME=/path/to/extra/game1:/path/to/extra/game2:...`

```
+ extra-game
|--- config.json { "name": "..." }
|--- + wsapi
|    |--- xxx.js (initialize(), process(ws, m, env))
|
|--- + static        --[mount]--> /extra/name
     |--- index.js              > /extra/name/index.js (window.boga.boardgame[name] = () => klass)
     |--- img                   > /extra/name/img

e.g. sample_extra_game
```
