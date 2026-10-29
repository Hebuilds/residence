/**
 * Line elevation of the residence, used by the loader. Groups are tagged with
 * data-stage so the loader can draw them from the centre outward: the central
 * arch first, then each wing extending left and right, then trees and water.
 * Every drawable element carries pathLength=1 so dash animation needs no measuring.
 */

const P = { pathLength: 1 } as const;

// One wing of the house, drawn for the right side and mirrored for the left.
function Wing({ side }: { side: 'right' | 'left' }) {
  const mirror = side === 'left' ? 'matrix(-1 0 0 1 1600 0)' : undefined;
  return (
    <g transform={mirror}>
      <g data-stage="2">
        <path {...P} d="M900 470 H1050 V620" />
        <path {...P} d="M900 481 H1050" />
        <path {...P} d="M925 585 V502 H1025 V585 Z" />
        <path {...P} d="M958 502 V585 M992 502 V585" />
        <path {...P} d="M918 592 H1032" />
      </g>
      <g data-stage="3">
        <path {...P} d="M1050 488 H1132" />
        <path {...P} d="M1127 488 V620" />
        <path {...P} d="M1058 488 v7 M1067 488 v7 M1076 488 v7 M1085 488 v7 M1094 488 v7 M1103 488 v7 M1112 488 v7 M1121 488 v7" />
        {/* bougainvillea spilling over the pergola */}
        <path
          {...P}
          d="M1052 488 c-2 -9 7 -14 13 -9 c1 -9 13 -10 16 -2 c4 -8 15 -6 15 2 c6 -6 15 -2 13 6 c7 -2 12 5 8 11 c4 4 2 11 -4 12 c3 7 -3 12 -9 10"
        />
        <path {...P} d="M1130 510 H1250 V620" />
        <path {...P} d="M1130 520 H1250" />
        <path {...P} d="M1150 600 V562 A14 14 0 0 1 1178 562 V600 Z" />
        <path {...P} d="M1202 600 V562 A14 14 0 0 1 1230 562 V600 Z" />
      </g>
      <g data-stage="4">
        <path {...P} d="M1250 576 H1342 V620" />
        <path {...P} d="M1282 620 V598 A12 12 0 0 1 1306 598 V620" />
      </g>
    </g>
  );
}

export default function ElevationDrawing({ className, portrait = false }: { className?: string; portrait?: boolean }) {
  return (
    <svg
      className={className}
      // Phones see the whole house, smaller, like a sketch in the middle of the page.
      viewBox={portrait ? '150 180 1300 640' : '0 0 1600 900'}
      preserveAspectRatio={portrait ? 'xMidYMid meet' : 'xMidYMid slice'}
      fill="none"
      stroke="currentColor"
      strokeWidth={portrait ? 2.6 : 1.15}
      strokeLinecap="butt"
      strokeLinejoin="round"
      aria-hidden
    >
      <defs>
        {/* Hide hill lines where they would run behind the building */}
        <mask id="behind-house" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900">
          <rect width="1600" height="900" fill="#fff" />
          <g fill="#000">
            <rect x="696" y="380" width="208" height="244" />
            <rect x="896" y="466" width="160" height="158" />
            <rect x="544" y="466" width="160" height="158" />
            <rect x="1046" y="470" width="90" height="154" />
            <rect x="464" y="470" width="90" height="154" />
            <rect x="1126" y="506" width="128" height="118" />
            <rect x="346" y="506" width="128" height="118" />
            <rect x="1246" y="572" width="100" height="52" />
            <rect x="254" y="572" width="100" height="52" />
            <rect x="1350" y="452" width="30" height="170" />
            <rect x="220" y="452" width="30" height="170" />
            <rect x="182" y="460" width="26" height="162" />
          </g>
        </mask>
      </defs>

      {/* far hills and the two volcanoes across the lake */}
      <g data-stage="hills" opacity={0.45} mask="url(#behind-house)">
        <path {...P} d="M0 566 C110 548 200 530 300 536 C420 543 500 512 610 516 C730 520 800 486 930 494 C1060 502 1140 528 1260 520 C1380 512 1470 536 1600 528" />
        <path {...P} d="M20 650 C90 610 150 552 196 482 L220 476 C228 471 246 471 254 476 L278 482 C322 552 384 612 460 646" />
        <path {...P} d="M1290 612 C1350 572 1402 534 1436 512 C1448 505 1460 505 1472 512 C1510 536 1556 570 1600 588" />
      </g>

      {/* the terrace the house sits on, and the lake below */}
      <g data-stage="0">
        <path {...P} d="M800 620 H170" />
        <path {...P} d="M800 620 H1430" />
        <path {...P} d="M800 644 H250 V620" />
        <path {...P} d="M800 644 H1350 V620" />
        <path {...P} d="M800 668 H190 V644" />
        <path {...P} d="M800 668 H1410 V644" />
        <path {...P} d="M800 706 H0" />
        <path {...P} d="M800 706 H1600" />
      </g>

      {/* the central volume */}
      <g data-stage="1">
        <path {...P} d="M700 620 V400 H900 V620" />
        <path {...P} d="M700 412 H900" />
        <path {...P} d="M706 384 H894 M712 400 V384 M760 400 V384 M800 400 V384 M840 400 V384 M888 400 V384" />
        <path {...P} d="M718 468 V440 H738 V468 Z M862 468 V440 H882 V468 Z" />
        <path {...P} d="M751 620 V486 A49 49 0 0 1 849 486 V620" />
        <path {...P} d="M736 628 H864 M728 636 H872" />
      </g>

      {/* The arch is kept on screen during the reveal: it becomes the window. */}
      <g data-stage="1" data-keep>
        <path id="loader-arch" {...P} d="M745 620 V485 A55 55 0 0 1 855 485 V620" />
      </g>

      <Wing side="right" />
      <Wing side="left" />

      {/* trees: a cypress and a palm on the right, a pair of cypresses on the left */}
      <g data-stage="4">
        <path {...P} d="M1365 620 C1350 560 1352 500 1365 455 C1378 500 1380 560 1365 620" />
        <path {...P} d="M1365 472 V612" />
        <path {...P} d="M1412 620 C1418 560 1424 500 1432 440" />
        <path {...P} d="M1432 440 C1450 425 1475 428 1492 448 M1432 440 C1455 438 1470 452 1478 476 M1432 440 C1425 418 1438 400 1462 396 M1432 440 C1410 422 1388 424 1372 440 M1432 440 C1412 440 1398 456 1394 478 M1432 440 C1440 418 1428 400 1408 394" />
        <path {...P} d="M235 620 C220 560 222 500 235 455 C248 500 250 560 235 620" />
        <path {...P} d="M235 472 V612" />
        <path {...P} d="M195 620 C184 576 186 520 195 462 C204 520 206 576 195 620" />
      </g>

      {/* ripples and birds */}
      <g data-stage="5" opacity={0.7}>
        <path {...P} d="M520 726 H604 M980 726 H1082 M300 746 H362 M1180 748 H1262 M702 764 H762 M860 782 H904 M110 738 H214 M1404 738 H1504 M600 800 H640 M1010 806 H1060" />
        <path {...P} d="M1066 318 q8 -7 16 0 q8 -7 16 0 M1112 342 q6 -5 12 0 q6 -5 12 0" />
      </g>

      {/* the sun doubles as the progress ring */}
      <g data-stage="sun">
        <circle cx="1196" cy="268" r="44" opacity={0.25} />
        <circle className="loader__sun" cx="1196" cy="268" r="36" pathLength={1} transform="rotate(-90 1196 268)" />
      </g>
    </svg>
  );
}
