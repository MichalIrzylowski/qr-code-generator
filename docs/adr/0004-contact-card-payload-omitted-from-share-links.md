# A share link carries a Contact card's Design, never its fields

`encodeShare` serialises the whole Payload into the URL. For a `url` or `text` Payload that is the
point: the link hands someone a finished thing. For a Contact card it would put a named person's
phone number, email address and postal address into a base64 blob that lands in browser history,
chat logs, server access logs and anywhere else the link is pasted. So Contact card Payloads are
omitted: the link restores the Design, the Caption and an empty card, and the UI says so through a
`shareOmitsPayload` predicate alongside the existing `shareOmitsLogo`.

The forcing constraint is what this app claims to be. The tagline is that nothing is uploaded and
nothing leaves the browser, and ADR-0001 makes that structural rather than a promise. A share link
is the one artefact that deliberately travels, and it was safe to build it that way while every
Payload was a public URL. Contact details are a different category of data with a different blast
radius, and the difference is invisible at the moment of sharing: the link looks identical either
way, so a user cannot see what they are handing over.

The alternative — include the fields, since it is the user's own data and they chose to share — is
defensible, and it is what makes the feature most useful. It was rejected because the choice is not
informed: sharing a design and sharing someone's contact details are different acts, and a single
"Copy link" button that silently does whichever one applies teaches the user nothing about which
just happened. Dropping the payload silently was rejected for the same reason in reverse.

The precedent already existed. The Logo Overlay is dropped from share links for a mechanical reason
(URL length), and `shareOmitsLogo` exists to admit it. Extending that vocabulary costs one predicate
and one Message, and keeps "your data never leaves your browser" literally true rather than
approximately true.

Consequences for future work: any Payload variant added later must answer this question explicitly
before it can be shared, and the honest default for anything carrying personal data is omission. A
Contact card link is therefore a *design* link — useful for handing a colleague the look of a card
so they can fill in their own details, which is arguably the sharing case that actually recurs.
