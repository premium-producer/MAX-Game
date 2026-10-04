# MAX Guided Reveal: choreography after the palm scan

30.09.2026. Scope: the six Guided Reveal missions, from the 0.8 s palm hold through the first route edge. This is a motion study; it does not change task content or the older Guided editions.

## Observed implementation before this change

`RevealJourney.pose` placed every node at the palm centre, sent it to a circular ring with starts 260 ms apart and 420 ms of travel, and waited for every spring to settle. Only then did a separate 900 ms ring-to-row animation begin, with another 120 ms stagger. The ring's angular order differed from the final row's X order, so some trajectories crossed. The palm shader filled its outline, but the intro light burst was only started by the old “Open MAX” action. Standalone background fluid had no scan emitter; the service page did not create a separate background.

A subsequent local revision replaced that ring with an ordered fan and started each fan-to-row arc immediately after its icon landed. It removed crossings but lost the collective circle and its brief hold. That is the behavior addressed by the current revision.

## Chosen motion

The revised brief restores a complete composition around the palm before the row. MAX leads with a 900 ms flight. The second icon starts at 780 ms, when MAX is near landing; the rest start every 250 ms and fly for 580 ms. Flights overlap. Already landed icons drift by up to 6 px while others are still moving, then settle into the ring. The ring remains still for 500 ms. Only after that does the whole group transfer on 800 ms curved paths into the row.

MAX always launches straight upward from the palm and lands at the crown of the ring. The other icons occupy the left, lower and right sectors. Their route order is monotonic in X during the transfer. MAX takes a separate upper arc to the leftmost row position, clear of the upper-left icon; the others transfer simultaneously on outward arcs. Captions and route links remain hidden until the row is actually settled. Numerical checks sample the full flight and transfer for all six missions, including the 4096 px wall geometry, and enforce icon clearance. The current values are art-direction parameters; they do not establish physical-wall acceptance.

The scan owns one local WebGL radial burst during the hold, using the existing prepared shader and clock. In standalone mode the same clock also drives small radial splats into the existing background solver. In the master the common LumiCells background remains authoritative; the game's local burst is foreground feedback and does not replace or resize that background.

Timing is a starting art direction, not a claim of physical acceptance. Keep the 0.8 s hold, completion/answer gates, reduced-motion order, manual positions, and a single animation clock. No GSAP dependency is required: the current `IconMotion` owner can accept continuous targets.

## Why this approach

Material's [choreography guidance](https://m1.material.io/motion/choreography.html) recommends staggering along a legible focal path and avoiding crossing elements. Its [movement guidance](https://m1.material.io/motion/movement.html) supports curved trajectories with smooth easing. The [GSAP timeline reference](https://gsap.com/cheatsheet/gsap-3-cheat-sheet.pdf) demonstrates overlapping starts and staggers as an orchestration pattern; it does not imply that adding GSAP is necessary here. The exact 780/250/500 ms values are project tuning decisions, not timings prescribed by those sources. The scan burst follows Material's [radial reaction](https://m1.material.io/motion/choreography.html) principle: visible feedback originates from the contact location.

The prior overlapping-fan implementation is documented in [its technical report](../../artifacts/reports/max-reveal-motion-20260930/README.md); the first ring implementation and the later [MAX-at-the-crown correction](../../artifacts/reports/max-reveal-max-top-20260930/README.md) have separate verification reports. Artistic judgment on the physical wall remains with the user.
