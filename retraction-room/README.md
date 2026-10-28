# The Retraction Room: setup

An escape-room game in four sessions for Foundations of Social Research (IMC Krems). Teams act as the review board of a journal and rule on real studies: keep, correct or retract. It is built like the other games in `edu-games-story`: plain HTML and JavaScript, Firebase Realtime Database for live data, hosted on GitHub Pages, with no build step.

## Files

| File | What it does |
|---|---|
| `index.html` | page shell and styles |
| `config.js` | Firebase settings, data branch name, instructor PIN |
| `content.js` | **all content**: rooms, locks, answers, hints, debrief notes, exit tests, study guides |
| `app.js` | game logic: cohorts, teams, scoring, instructor console, exports |
| `INSTRUCTOR_GUIDE.md` | how to run the sessions |

## Put it online in 4 steps

1. Copy the whole folder into the `edu-games-story` repository and name it `retraction-room` (next to `operations/`, `quiz/` and the others).
2. Open `config.js` and change `INSTRUCTOR_PIN` from `0000` to your own PIN. The Firebase settings are already filled in with the same project as your other games (`my-edu-games`). The game writes only under its own branch, `retraction-room/`, so it does not touch the other games' data.
3. If your Firebase Realtime Database rules list each game's branch separately, add this entry next to the others:
   ```json
   "retraction-room": { ".read": true, ".write": true }
   ```
4. Commit and push. The game will be at `https://emgiees.github.io/edu-games-story/retraction-room/`.

## Test it first

Add `?local=1` to the address, for example `https://emgiees.github.io/edu-games-story/retraction-room/?local=1`. The game then runs entirely in your browser with no Firebase, so you can create test cohorts and play every room without touching real data. To test on your own computer, run `python3 -m http.server 8000` in the folder and open `http://localhost:8000/?local=1`.

The answer codes are kept outside this folder (in `answer-key.md`, delivered separately) so they don't end up on GitHub, where students could find them.

## Optional: a tile on the hub page

```html
<a href="retraction-room/" class="card">
  <h3>The Retraction Room</h3>
  <p>A data scandal has hit a business journal. Over four sessions, teams rule on real studies
  (the Literary Digest poll, a retracted honesty study, power posing, the Hawthorne studies,
  New Coke) and learn sampling, descriptive statistics, ANOVA, regression, observation,
  interviews and focus groups.</p>
  <span>4 rooms · teams of about 5 · study guides · exit tests</span>
</a>
```

## Data and privacy

- The game stores team names, progress, and each student's name with their exit-test answers in Firebase (region europe-west1). Nothing else about students is collected.
- Like your other games, the database branch is publicly readable and writable, and the PIN is a soft barrier. Do not store anything sensitive there.
- For accreditation, download the results (Excel) and a backup (.json) for each cohort at the end of the semester and keep them with your course records. After that you can delete the `retraction-room` branch in the Firebase console if you want to remove the data online.

## Changing content

Everything students see is in `content.js`. Each lock has an `answer` list; answers are compared without spaces, commas, dots or `%` and are not case-sensitive, so "50,000" and "50000" both work. Exit tests have 8 questions per room, and `a` is the position of the correct option (counting from 0). Charts are drawn in `app.js` and placed with `{{chart:id}}` in the text.
