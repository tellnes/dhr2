# Domain-based HTTP Forwarding (DHFR)

__Domain-based HTTP Forwarding (DHFR)__ is a method that is using DNS to manage the forwarding of HTTP requests. This is done by inserting special TXT records in the DNS configuration and point the domain to one or more DHFR servers.

For example if you have the following dns configuration:

    example.com    IN    TXT    "v=DHFR1; l=http://www.iana.org/domains/example/"
    example.com    IN    A      192.0.43.10

then the DHFR server responds as follows:

    > curl -Is http://example.com/
    HTTP/1.1 302 Moved Temporarily
    Location: http://www.iana.org/domains/example/
    Connection: Keep-Alive


## Using CNAME

DHFR is CNAME compatible. This is done by having several rules on the domain name that the CNAME record is pointing to.

    github.example.com    IN    CNAME    server.example.com

    server.example.com    IN    A        192.0.43.10
    server.example.com    IN    TXT      "v=DHFR1; l=www.example.com"
    server.example.com    IN    TXT      "v=DHFR1; l=github.com; d=github.example.com"

This will result in:

    > curl -Is http://server.example.com/ | grep Location
    Location: http://www.example.com/

    > curl -Is http://github.example.com/ | grep Location
    Location: http://github.com/


## Wildcard

To match multiple domains under one when using CNAME, you can use a wildcard.

    github.example.com    IN    CNAME    server.example.com
    any.example.com       IN    CNAME    server.example.com

    server.example.com    IN    A        192.0.43.10
    server.example.com    IN    TXT      "v=DHFR1; l=www.example.com"
    server.example.com    IN    TXT      "v=DHFR1; l=www.github.com; d=github.example.com"
    server.example.com    IN    TXT      "v=DHFR1; l=google.com; d=*.example.com"

This will result in:

    > curl -Is http://server.example.com/ | grep Location
    Location: http://www.example.com/

    > curl -Is http://github.example.com/ | grep Location
    Location: http://github.com/

    > curl -Is http://any.example.com/ | grep Location
    Location: http://www.google.com/
