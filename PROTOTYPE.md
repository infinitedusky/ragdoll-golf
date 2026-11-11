# Prototype report: Swing Lab with a real rigged golfer (RG-1)

Branch `prototype/swing-lab-with-a-real-rigged-golfer-xn1v`. Screen at `/swing-lab` (link on Home).
Code: `src/screens/swing-lab.js`, `src/golfer/{skeleton,address-pose,club}.js`, solver `scripts/solve-address.mjs` + `scripts/body-pose.json`.

## 1. The GLB

**Chosen for the prototype: `Xbot.glb`** from the three.js examples (r170), saved as `public/models/golfer.glb`.

- **Licence: not CC0.** It is Adobe Mixamo's X Bot. You can use Mixamo characters royalty-free in projects, but you can't redistribute them as standalone files. Soldier.glb and Michelle.glb are also Mixamo, under the same terms. Before shipping, the build needs either a CC0 rig or a decision that Adobe's terms cover a public repo.
- **Bones:** 67 bones named `mixamorig:Hips` … `mixamorig:RightToe_End` (spine ×3, neck/head, clavicles, arms, 4-joint fingers and thumb, legs, toes, eyes). three.js's GLTFLoader **removes the colon**: at runtime they are `mixamorigHips`. Strip `/^mixamorig:?/`.
- **Scale and orientation: no fixing needed.** It is authored in centimetres under a 0.01 root scale, so it is already metres, about 1.8 m tall. It faces +Z, with its left side at +X, which already matches our conventions. Feet are at y≈0.
- **Bind:** a T-pose with **every bone's bind rotation at identity**. That is the key fact: in bind, each bone's local X/Y/Z are the world axes, so name → degrees tables mean something.
- Any Mixamo-rigged character works with this code unchanged. A Quaternius rig (UE5-style names) would need a name map.

## 2. Posing address

Moderately hard by hand, easy with a solver. The body angles were set by hand (`scripts/body-pose.json`). The arms are solved with **analytic two-bone IK**: the elbow is a pure hinge on the forearm's local Y, the pole points the elbows back toward the hips, and the hand frame is set directly from the grip. The stance is searched along Z until the arm that has to reach further is 97.5% straight. Coordinate-descent IK (tried first) got stuck in odd clavicle angles. Use analytic IK.

- Bones needed: Hips, Spine/Spine1/Spine2, Neck, Head, both clavicles (Shoulder), Arm, ForeArm, Hand, UpLeg, Leg, Foot, plus finger curl (40 bones in all).
- Root at `[0, -0.054, 0.087]` m.
- The torso (Hips → mid-shoulders) ends up **about 33° from vertical**, a little below the brief's 35–40°. The Hips value of 28° is mostly cancelled by the legs.
- The right hand sits 9 cm further down the grip, so the right shoulder must be **lower and further forward**: spine side-bend away from the target (Z +9/+6/+4) and a protracted, dropped right clavicle (`RightShoulder [0, 30, 26]`). Without that the right arm is 3 to 12% too short. In the final pose the right arm is nearly straight and the **left arm is slightly bent** (93% reach), which is the opposite of good golf. The next tuning step is more side bend so the left arm can straighten.

### Address pose (local Euler XYZ, degrees, relative to bind; unlisted bones stay at 0)

| Bone | X | Y | Z |
|---|---|---|---|
| Hips | 28 | 0 | 0 |
| Spine | 10 | 0 | 9 |
| Spine1 | 6 | 0 | 6 |
| Spine2 | 4 | 0 | 4 |
| Neck | −14 | 0 | −8 |
| Head | −14 | 0 | −10 |
| LeftShoulder | 0 | −10 | −12 |
| LeftArm | −44.3 | 8.9 | −92.3 |
| LeftForeArm | 0 | −41.7 | 0 |
| LeftHand | −14.7 | 6.9 | 4.8 |
| RightShoulder | 0 | 30 | 26 |
| RightArm | −52.2 | 23.2 | 56.6 |
| RightForeArm | 0 | 25.7 | 0 |
| RightHand | 6.9 | −13.9 | −17.5 |
| LeftUpLeg / RightUpLeg | −50 | 0 | ±7 |
| LeftLeg / RightLeg | 34 | 0 | 0 |
| LeftFoot / RightFoot | −12 | ∓8 | ∓7 |
| Fingers 1/2/3 (Index…Pinky) | 0 | spread | 55 / 75 / 45 (−Z left, +Z right) |
| Thumb1/2/3 | ∓20, ±25… | | see `address-pose.js` |

## 3. The club in the hand

The offset is **computed, not tuned**. The club stays at the mockup's world placement (heel of the sole at `[0.026, 0, 0.906]`), the hands are solved onto it, and the club's matrix in the RightHand frame becomes the offset:

`position [-95.8, -3.16, 4.96]` (cm, hand frame), `quaternion [0.1375, -0.1983, -0.6787, 0.6936]`, `scale 100` (to undo the rig's 0.01).

The grip targets are palm centres on the shaft axis, 5.5 cm (left) and 13 cm (right) below the butt, fingers pointing down the shaft. The palm centre is modelled as 5.5 cm along and 3 cm below the wrist joint.

**The left hand needs IK at runtime, not just a tuned rotation.** At address a tuned rotation is enough, and it is exact. But the left hand is only posed, not attached: as soon as you move Spine, a clavicle or the right arm, the club leaves the left hand. The build should run the same two-bone IK each frame, with the left wrist target taken from the club (a grip socket on the club). The solver code is ~40 lines and ports directly.

## 4. Rotating by name from the panel

It is smooth: sliders feel immediate and the club follows. But the numbers are only **intuitive for bones near bind**.

- The elbows and knees are clean single-axis hinges (forearm Y, leg X). They are easy to understand.
- The spine, neck and legs read naturally: X bends forward, Z bends sideways.
- The arms are not intuitive. Their local frames start in the T-pose, so "arm hanging" is `Z ≈ ±90` and the other two sliders then rotate about axes that no longer look like X/Y. Euler XYZ locks at Y=±90, not at the ±90 Z the arms use, so the readback is stable, just hard to reason about.
- Recommendation for the build: keep XYZ local Euler as the storage format (a simple table, round-trips cleanly), but in the UI show axis labels that say what each slider does per bone ("bend", "twist", "raise"), and draw a small local-axis gizmo on the selected bone. Better still, measure arm angles from an arms-down rest pose rather than the T-pose.

## 5. What makes the brief wrong

- "Parent the club to the right hand, with the left hand on the grip" is only true at the moment of address. Keeping the left hand on the grip needs runtime IK (see 3), so the build should plan for it.
- The licence line in the top bar can't say CC0 for Xbot. The model choice is still open (see 1).
- The bones come from the GLB as `mixamorigHips`, not `Hips`. The skeleton module must own the name mapping.
- The 67-bone list is too long for the panel. The prototype hides fingers, eyes and `_End` bones behind a checkbox (22 shown by default). The build should do the same, or group them.
- "Spine 35–40°" isn't one bone value: tilt is shared by Hips and three spine bones, and the legs cancel part of it. State the target as torso angle, not a Spine rotation.
- The fingers matter visually. Without a curl the hands look like they're waving at the club. Treat the finger curl as part of the default pose.
