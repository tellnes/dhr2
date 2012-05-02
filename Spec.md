# Domain-based HTTP Forwarding Ruleset (DHFR)

This document is still under development and is subject to change.


## Overview

TODO


## Tag Registry


Tag Name | Required | Purpose                | Sample
-------- | -------- | ---------------------  | ----
v        | required | Protocol version       | `v=DHFR1`
l        | required | Location to forward to | `l=www.example.com`
s        | optional | HTTP Status code       | `s=m`
t        | optional | TTL for cache headers  | `t=86400`
d        | optional | Domain name            | `d=*.example.com`
p        | optional | Row priority           | `p=10`
i        | optional | Ignore path            | `i`


## General Record Format

DHFR records follow the extensible "tag-value" syntax for DNS-based key records defined in [[DKIM](http://tools.ietf.org/html/rfc6376)].

The following tags are introduced as the initial valid DHFR tags:


### d
_optional; default value `*`_

Indicates the domain to which the entry applies. Useful if it is used `CNAME` records. May contain `*` to match multiple domains.

#### Examples
- `example.com` matches only example.com
- `*.example.com` matches all subdomains of example.com
- `example.*` matches all subdomains named example (eg. example.net and example.google.com)
- `*` matches any domain

### l
_required_

The HTTP URI that we will forward the user to.

If it does not start with `http://` or `https://`, it must be prefixed with `http://`.


### i
_optional_

If set the path will not be added to the end of the forwarding address.

This tag is a boolean and has no value.


### p
_optional; default value depends_

Indicates how the entry is prioritized. This is useful if there is more than one DHFR entry for a domain. If not set, it will have a negative value based on the `d`-tag based on the rules below. The higher the value the higher the priority.

- If `d` is `*` (or not set), `p` will have default value `-3`
- Or if `d` contains `*`, `p` will have default value `-2`
- Otherwise will `p` will have default value `-1`


### s
_optional; default is `f`_

Indicates whether the HTTP status code should be a `301 Moved Permanently` or a `302 Found` response. Can either have the value `f` or `m`.

- `f` indicates a `301 Moved Permamently` HTTP response
- `m` indicates a `302 Found` HTTP response


### t
 _optional_

Time to live in seconds for use in HTTP cache headers.

If set the HTTP responses will include an `Expire` and a `Cache-Control` header.


### v
_required; default is `DHFR1`_

Identifies the record retrieved as a DHFR record. The value of this tag MUST match precisely; if it does not or it is absent, the entire retrieved record MUST be ignored.