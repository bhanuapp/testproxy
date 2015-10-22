snproxy
=======

Simple forward proxy built on Node, Express and http-proxy.

Methods
====

### sn.processReq
Use `sn.processReq(req)` to modify request before they are sent to their destination.

Routes
=======

### /signnow/api/< endpoint >
Routes all request to https://api.signnow.com

`curl -H 'Authorization: Bearer ACCESS_TOKEN' http://localhost/signnow/api/user`

### /signnow/eval/< endpoint >
Routes all request to https://capi-eval.signnow.com

`curl -H 'Authorization: Bearer ACCESS_TOKEN' http://localhost/signnow/eval/user`

### /requestbin/< requestbin id >
Routes all request to http://requestb.in/

`curl -H 'Authorization: Bearer ACCESS_TOKEN' http://localhost/requestbin/<id>`
