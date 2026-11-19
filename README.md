# News Image — 19 November 2026

[![make.fun · news-image-20261119](https://make.fun/badge/news-image-20261119.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![rank](https://make.fun/badge/news-image-20261119/herlienn/news-image-entry-19nov/rank.svg)](https://make.fun/bounty/news-image-20261119/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![reward](https://make.fun/badge/news-image-20261119/herlienn/news-image-entry-19nov/reward.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)

One image that sums up the world's news of Thursday, 19 November 2026,
drawn as a one-page newspaper front page. The program draws every pixel
itself: a hand-made 5x7 bitmap font, drawn scenes and pictograms made from
plain shapes, and a hand-written PNG encoder. Standard library only, no
network, and every run writes byte-identical output.

## The model

This entry follows the pattern of the top-ranked entries of the 18 November
edition, which packed 40+ stories into one page: a count line up front
("35 STORIES - 6 CONTINENTS - ONE DAY"), a per-region count bar, a "Day in
Numbers" strip, three large illustrated hero panels, a world map with pins
marking where each story happened, a numbered "Also on" list, a "By the
Clock — UTC" timeline, and a footer with sources and a date check.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png` (1024x1024, about 46 KB).

## What the image covers

- **Lead — Trump, Xi and Putin meet in Shenzhen:** the first-ever
  three-way meeting of the three nuclear powers, on the APEC sidelines;
  officials expect no deal.
- **GTA VI goes on sale around the world:** Rockstar's game unlocks at
  midnight in each region; Metacritic 99.
- **World court rules on Myanmar genocide case:** the ICJ reads its
  judgment in The Gambia v. Myanmar at 10:00 UTC in The Hague.
- **Plus 32 more stories** across six continents: Anthropic's Nasdaq
  debut at $83, Voyager 1 reaching one light-day, Cyclone Akvan bearing
  down on India, the EU's 45-billion-euro loan plan for Ukraine, the
  Crimea bridge hit again, Israel's ground move into central Gaza,
  Democrats taking the US Senate 56-44, Nvidia's export curbs taking
  effect, and more — with a world map, a numbered list and a UTC timeline.
- **Date check:** the US-Iran strikes on Qeshm Island and in the Gulf
  were first reported on 18 November, not today, so they are deliberately
  not in this picture, even though they led yesterday's news.
