/* ============================================================
   THE RETRACTION ROOM - all game content
   ------------------------------------------------------------
   Rooms, locks, hints, debrief notes, exit tests and study guides.
   Everything a teacher may want to edit lives in this file; the
   game logic is in app.js.

   Lock answers are compared after removing spaces, commas and
   dots and converting to upper case, so "50,000", "50 000" and
   "50000" are the same answer. A trailing K means thousand.
   Charts are inserted where a {{chart:id}} placeholder appears.
   ============================================================ */

(typeof window !== 'undefined' ? window : globalThis).RR_CONTENT = {

meta: {
  title: 'The Retraction Room',
  course: 'Foundations of Social Research',
  institution: 'IMC Krems',
  version: '2.0',
  roomMinutes: 55,
  lockPoints: 100,
  wrongCost: 5,
  hintCost: [5, 15],
  minPoints: 40,
  journal: 'Journal of Applied Business Behaviour'
},

rooms: [

/* ================================================================
   ROOM 1 - THE DATA VAULT
   ================================================================ */
{
  id: 'r1', number: 1, title: 'The Data Vault',
  methods: 'Sampling and descriptive statistics',
  story: `A data scandal has hit the <i>Journal of Applied Business Behaviour</i>. You are its emergency review board. Before the press conference you must decide which famous studies to keep, correct or retract. The archive locks behind you, and the only way out is to understand the evidence.`,
  locks: [
  {
    id: 'frame', title: 'The Ballot Box', tag: 'Case file 1936-LD', guide: 'Population, frame, sample, respondents',
    intro: `<p>In 1936 the magazine <i>The Literary Digest</i> ran the largest poll anyone had ever seen to predict the US presidential election between Franklin D. Roosevelt and Alf Landon. It mailed mock ballots to people it found in <b>telephone directories</b> and <b>car registration lists</b>, plus its own subscribers.</p>
    <div class="facts">
      <div class="fact"><div class="v">≈10 million</div><div class="k">ballots mailed</div></div>
      <div class="fact"><div class="v">≈2.4 million</div><div class="k">ballots returned</div></div>
      <div class="fact"><div class="v">Landon 57%</div><div class="k">Digest prediction</div></div>
      <div class="fact"><div class="v">Roosevelt 61%</div><div class="k">actual result, 46 of 48 states</div></div>
    </div>`,
    task: `<p>Every survey has four layers. Match each term to the matching part of the Digest poll, then enter the four numbers <b>in the order of the terms</b>.</p>
    <div class="match">
      <div><div class="eyebrow">Terms</div><ol class="items" type="A"><li>Population</li><li>Sampling frame</li><li>Sample</li><li>Respondents</li></ol></div>
      <div><div class="eyebrow">Parts of the poll</div><ol class="items"><li>The 2.4 million people who sent a ballot back</li><li>The lists of phone owners, car owners and subscribers</li><li>All Americans who would vote in November 1936</li><li>The 10 million people who were mailed a ballot</li></ol></div>
    </div>`,
    format: '4 digits, e.g. 1234', answer: ['3241'],
    hints: ['The population is who you want to learn about, not who you managed to reach.', 'Order from widest to narrowest: everyone who votes, then the lists, then the people mailed, then the people who answered. The code starts with 3.'],
    reveal: `<p>The Digest had a huge sample, but it was drawn from the wrong frame. In 1936, in the middle of the Great Depression, owning a phone or a car meant you were better off than most voters, and better-off voters leaned towards Landon.</p>`,
    debrief: ['Population, sampling frame, sample and respondents are different groups, and each step down can introduce bias.', 'A sampling frame is a practical list, so ask who is missing from it.']
  },
  {
    id: 'bias', title: 'Two Kinds of Bias', tag: 'Case file 1936-LD', guide: 'Bias versus random error',
    intro: `<p>Researchers have argued about why the Digest failed ever since. A later analysis of a 1937 Gallup survey (Squire, 1988) found that the frame was only part of the story: <b>Landon supporters were also more likely to mail their ballot back</b>. Meanwhile George Gallup predicted a Roosevelt win from a much smaller sample of about 50,000 people, chosen to match the make-up of the electorate.</p>`,
    task: `<p>Which statements are supported by the case? Exactly <b>three</b> are true. Enter their letters in alphabetical order.</p>
    <div class="opts">
      <div class="opt"><span class="tag">A</span><span>The poll would have been accurate if all 10 million people had replied.</span></div>
      <div class="opt"><span class="tag">B</span><span>Coverage bias: poorer voters were less likely to be in the sampling frame at all.</span></div>
      <div class="opt"><span class="tag">C</span><span>With 2.4 million answers, random sampling error explains the wrong prediction.</span></div>
      <div class="opt"><span class="tag">D</span><span>Non-response bias: the people who chose to reply differed from those who did not.</span></div>
      <div class="opt"><span class="tag">E</span><span>Gallup's smaller sample did better because it represented the voters better.</span></div>
      <div class="opt"><span class="tag">F</span><span>The bigger the sample, the less you need to worry about who is in it.</span></div>
    </div>`,
    format: '3 letters, e.g. ACE', answer: ['BDE'],
    hints: ['Random error shrinks as a sample grows. With 2.4 million answers it is tiny, so something systematic went wrong.', 'Two statements name a type of bias, and one compares the Digest with Gallup.'],
    reveal: `<p>Statement A is false because even a 100% reply rate leaves out everyone who was never on the lists. Bias is a problem of <b>who</b> you ask, and sample size cannot fix it.</p>`,
    debrief: ['Coverage bias comes from the frame, and non-response bias comes from who chooses to answer.', 'A larger sample only reduces random error. A small, representative sample beats a huge, biased one.']
  },
  {
    id: 'table', title: 'The Summary Table', tag: 'Case file PNAS-2012', guide: 'Mean, median, SD and range',
    intro: `<p>Fast forward to 2012. A paper in <i>PNAS</i> by Shu, Mazar, Gino, Ariely and Bazerman claimed that <b>signing an honesty pledge at the top</b> of a form, instead of the bottom, makes people more honest. Its field study used a US car insurer: <b>13,488 customers</b> reported their current odometer reading, and the lower the mileage, the cheaper the insurance. "Miles driven" is the new reading minus an older reading the insurer already had.</p>
    <blockquote>Customers who signed at the top reported about 2,400 more miles driven (10.3%) than those who signed at the bottom, so they were more honest.</blockquote>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Miles driven, car 1</th><th>Mean</th><th>Median</th><th>SD</th><th>Min</th><th>Max</th></tr></thead>
      <tbody>
        <tr><td>Signed at the top</td><td>26,100</td><td>26,150</td><td>14,350</td><td>3</td><td>49,994</td></tr>
        <tr><td>Signed at the bottom</td><td>23,700</td><td>23,650</td><td>14,420</td><td>11</td><td>49,986</td></tr>
      </tbody>
    </table></div>
    <p class="note">Illustrative table for teaching. The 2,400-mile difference is from the paper, and the other values show the pattern later found in the published data.</p>`,
    task: `<p>Read the table carefully. Real drivers vary a lot, and some drive far more than others. What is the <b>largest number of miles any car drove</b> in this dataset, rounded to the nearest thousand?</p>`,
    format: 'a number, e.g. 12000', answer: ['50000', '50'],
    hints: ['Look at the Max column.', 'Both maximums are just below a suspiciously round number. Round 49,994 to the nearest thousand.'],
    reveal: `<p>Notice two more things. The <b>mean and median are almost equal</b>, so the data are symmetric. Real mileage is usually right-skewed: most people drive a moderate amount, and a few drive a lot, which pulls the mean above the median. And <b>nobody drove more than 50,000 miles</b>. Keep that in mind for the next lock.</p>`,
    debrief: ['Mean versus median tells you about the shape of the data. When the mean is well above the median, the data are right-skewed.', 'SD is the typical distance from the mean, and min and max show the range. Always check that they make sense for the real world.']
  },
  {
    id: 'histogram', title: 'The Shape of a Lie', tag: 'Case file PNAS-2012', guide: 'Reading a histogram',
    intro: `<p>In 2020 the original authors and colleagues repeated the paper's lab experiments and could not find the effect. In August 2021 the research blog <i>Data Colada</i> took a close look at the published data file of the insurance study. The charts below show the pattern they found.</p>
    <div class="charts">
      <figure>{{chart:r1-real}}<figcaption>A: What odometer differences usually look like (illustrative)</figcaption></figure>
      <figure>{{chart:r1-fake}}<figcaption>B: The pattern in the study's data, car 1 (illustrative reconstruction)</figcaption></figure>
    </div>
    <figure>{{chart:r1-rounding}}<figcaption>C: How often readings end in 000 or 00. People reading an odometer by eye often round, so honest data show some rounding. *00 includes 000. Illustrative values.</figcaption></figure>`,
    task: `<p>Which observations are <b>red flags</b> that the data did not come from real drivers? Exactly <b>three</b> are. Enter their letters in alphabetical order.</p>
    <div class="opts">
      <div class="opt"><span class="tag">A</span><span>In chart B, every 5,000-mile band from 0 to 50,000 is about equally common.</span></div>
      <div class="opt"><span class="tag">B</span><span>Chart A has a long tail to the right.</span></div>
      <div class="opt"><span class="tag">C</span><span>In chart B, no car drove more than 50,000 miles, and the distribution stops abruptly.</span></div>
      <div class="opt"><span class="tag">D</span><span>The sample of 13,488 customers is too small to trust.</span></div>
      <div class="opt"><span class="tag">E</span><span>New (Time 2) readings almost never end in 00 or 000, even though the old (Time 1) readings often do.</span></div>
      <div class="opt"><span class="tag">F</span><span>The mean is higher than the median in chart B.</span></div>
    </div>`,
    format: '3 letters, e.g. BDF', answer: ['ACE'],
    hints: ['A long right tail (B) is what real data look like, so it is not a red flag. 13,488 is a large sample.', 'A computer that draws "a random number between 0 and 50,000" produces a flat shape, a hard cutoff and no rounding.'],
    reveal: `<p>Data Colada concluded that the Time 2 numbers were most likely generated with a random number generator. A flat (uniform) distribution with a hard stop at 50,000 and no human rounding is very hard to explain any other way. They also found duplicated rows in the file.</p>`,
    debrief: ['A histogram shows the shape of the data. Check it before you trust any average.', 'Real human data are messy: they have skew, outliers and rounding. Data that are too clean are a warning sign.']
  },
  {
    id: 'verdict', title: 'The Verdict', tag: 'Board ruling', guide: 'Replication and retraction',
    intro: `<p>The board has seen the evidence. The journal will publish your ruling at tonight's press conference.</p>`,
    task: `<p>Choose the ruling <b>and</b> the reason that best fits the evidence.</p>
    <div class="opts">
      <div class="opt"><span class="tag">K</span><span>Keep. With 13,488 customers, the result must be reliable.</span></div>
      <div class="opt"><span class="tag">C</span><span>Correct. The effect is real but smaller than reported.</span></div>
      <div class="opt"><span class="tag">R</span><span>Retract. The study failed to replicate, and that alone shows it was fraud.</span></div>
      <div class="opt"><span class="tag">X</span><span>Retract. The data pattern could not have come from real drivers, so the conclusions have no basis.</span></div>
    </div>`,
    format: '1 letter', answer: ['X'],
    hints: ['Many honest studies fail to replicate. A failed replication raises doubt, but it does not prove misconduct.', 'Which ruling rests on the evidence you found yourselves in locks 3 and 4?'],
    reveal: `<p><b>Room cleared.</b> PNAS retracted the paper in September 2021. The 2020 replication had already shown the effect did not hold up, but it was the descriptive statistics, a histogram and a look at rounding, that revealed the data could not be real. You need no advanced maths to spot a problem like this, only careful reading.</p>`,
    debrief: ['A failed replication and fabricated data are different things, and you should not mix them up.', 'Your toolkit from this room: the four layers of sampling, two kinds of bias, mean versus median, SD and range, and reading a histogram.']
  }],
  test: [
    { q: 'A sampling frame is…', o: ['the people who actually answer a survey', 'the list or source from which the sample is drawn', 'the whole group you want to learn about', 'the questionnaire itself'], a: 1 },
    { q: 'Why did 2.4 million answers not save the Literary Digest poll?', o: ['The answers were counted incorrectly', 'Random error is large in big samples', 'A larger sample does not remove bias in who was asked and who replied', 'Voters changed their minds after the poll'], a: 2 },
    { q: 'A company emails a satisfaction survey, and mostly very angry customers reply. This is an example of…', o: ['non-response bias', 'a representative sample', 'random sampling error', 'a population'], a: 0 },
    { q: 'In a salary dataset the mean is €62,000 and the median is €48,000. The distribution is most likely…', o: ['symmetric', 'right-skewed (a few very high salaries)', 'left-skewed (a few very low salaries)', 'uniform'], a: 1 },
    { q: 'The standard deviation tells you…', o: ['the most common value', 'how spread out the values are around the mean', 'the difference between the max and the min', 'whether the result is significant'], a: 1 },
    { q: 'A histogram of "minutes spent in store" is completely flat between 0 and 60 and nobody stayed longer than 60. What should a researcher do first?', o: ['Report the mean, since it is a large sample', 'Delete the customers who stayed exactly 60 minutes', 'Nothing, since flat data are normal for human behaviour', 'Treat it as a warning sign and check how the data were collected'], a: 3 },
    { q: 'A famous study fails to replicate. What can you conclude?', o: ['The original finding is less reliable than it seemed', 'The original authors committed fraud', 'The replication must have been done wrongly', 'Nothing, since replications do not matter'], a: 0 },
    { q: 'Which of these is a descriptive statistic?', o: ['The median', 'A research question', 'A sampling frame', 'A hypothesis'], a: 0 }
  ],
  guide: {
    minutes: 25,
    goals: ['Tell apart population, sampling frame, sample and respondents', 'Explain the difference between bias and random error', 'Read mean, median, standard deviation, minimum and maximum from a table', 'Describe the shape of a histogram and say when it looks suspicious'],
    sections: [
    { h: 'Population, frame, sample, respondents', html: `
      <p>Every survey tries to learn about a large group by asking a smaller one. Four layers sit between the question and the answer:</p>
      <ul>
        <li><b>Population:</b> everyone you want to say something about, for example all customers of an Austrian bank.</li>
        <li><b>Sampling frame:</b> the actual list you draw people from, for example the bank's email list. People with no email address on file are missing from the frame.</li>
        <li><b>Sample:</b> the people you select from the frame and invite, for example 2,000 randomly chosen addresses.</li>
        <li><b>Respondents:</b> the people who actually answer, for example the 540 who fill in the survey.</li>
      </ul>
      <p>At every step you can lose people, and if the people you lose are different from those you keep, your results become biased.</p>` },
    { h: 'How samples are chosen', html: `
      <ul>
        <li><b>Simple random sample:</b> everyone in the frame has the same chance of being chosen. This is the gold standard.</li>
        <li><b>Stratified sample:</b> you split the frame into groups (for example by region) and draw randomly within each group, so every group is represented.</li>
        <li><b>Quota sample:</b> you keep recruiting until you have, say, 50% women and 30% under-25s, but people are not chosen randomly.</li>
        <li><b>Convenience sample:</b> you ask whoever is easy to reach, such as your classmates or your Instagram followers. It is cheap, but it is rarely representative.</li>
      </ul>` },
    { h: 'Bias versus random error', html: `
      <p>Two different things can make a survey result wrong.</p>
      <p><b>Random sampling error</b> is the natural wobble you get because you asked some people and not all. It gets smaller as the sample gets bigger. That is why a poll of 1,000 people can be quite precise.</p>
      <p><b>Bias</b> is a systematic error: your sample is different from the population in a way that pushes results in one direction. A bigger sample does not fix bias. It only gives you a more precise wrong answer.</p>
      <ul>
        <li><b>Coverage bias:</b> some groups are missing from the frame. Example: an online survey cannot reach people who are not online.</li>
        <li><b>Non-response bias:</b> the people who answer differ from those who don't. Example: very happy and very angry customers reply to feedback emails more often than everyone else.</li>
        <li><b>Self-selection bias:</b> people decide for themselves whether to take part, for example in an open online poll.</li>
      </ul>
      <div class="example"><b>Worked example.</b> A café asks customers to rate it on a tablet by the exit. 300 people rate it, and the average is 4.8 out of 5. Is the café excellent? Maybe, but people who had a bad experience may leave without stopping at the tablet (non-response bias), and regulars who love the café may rate it every day (self-selection). 300 ratings sound like a lot, but size does not remove these biases.</div>` },
    { h: 'Descriptive statistics', html: `
      <p>Descriptive statistics summarise data. You will not need to calculate them in the game, but you need to know what each one tells you.</p>
      <div class="tbl-wrap"><table class="left">
        <thead><tr><th>Statistic</th><th>What it is</th><th>What it tells you</th></tr></thead>
        <tbody>
          <tr><td>Mean</td><td>the average: add all values and divide by how many there are</td><td>the "centre", but it is pulled by extreme values</td></tr>
          <tr><td>Median</td><td>the middle value when you sort the data</td><td>the "typical" case; extreme values do not move it</td></tr>
          <tr><td>Mode</td><td>the most common value</td><td>useful for categories, such as the most popular product</td></tr>
          <tr><td>Standard deviation (SD)</td><td>roughly the typical distance of a value from the mean</td><td>how spread out the data are; a bigger SD means more variety</td></tr>
          <tr><td>Min, max, range</td><td>smallest value, largest value, and the gap between them</td><td>whether the data make sense in the real world</td></tr>
        </tbody>
      </table></div>
      <div class="example"><b>Worked example.</b> Five interns earn €900, €950, €1,000, €1,050 and €4,000 a month. The median is €1,000, which describes most interns well. The mean is €1,580, because the one well-paid intern pulls it up. When the mean is much higher than the median, a few very large values are present.</div>` },
    { h: 'Reading a histogram', html: `
      <p>A histogram groups values into bands (for example 0–5,000 km, 5,000–10,000 km) and shows how many cases fall in each band. Its <b>shape</b> tells a story:</p>
      <ul>
        <li><b>Symmetric, bell-shaped:</b> most values are near the middle and fewer are far away (for example body height). Mean ≈ median.</li>
        <li><b>Right-skewed:</b> most values are low to moderate, with a long tail of high values (for example income, kilometres driven, time spent on an app). Mean &gt; median.</li>
        <li><b>Left-skewed:</b> a long tail of low values (for example exam scores on an easy test). Mean &lt; median.</li>
        <li><b>Uniform (flat):</b> every band is about equally common. This is rare in human behaviour. It is what a computer produces when it draws random numbers within a range.</li>
      </ul>
      <p>Real human data are also messy: people round numbers (they say "about 20,000 km"), and there are outliers. Data that are perfectly smooth, perfectly flat or stop at a round number deserve a second look.</p>` },
    { h: 'Replication and retraction', html: `
      <p><b>Replication</b> means repeating a study, ideally with new and larger samples, to see if the result holds. Many findings, including honest ones, fail to replicate. A failed replication tells you the original result may have been a fluke, may only hold in special conditions, or may have been reported too optimistically.</p>
      <p><b>Retraction</b> means the journal withdraws a published paper. It happens when the results cannot be trusted at all, for example because of serious errors or fabricated data. A failed replication alone is usually not a reason to retract.</p>
      <p>In the game the board has three options: <b>keep</b> (the paper stands), <b>correct</b> (the paper stays, but some claims are limited or fixed) and <b>retract</b> (the paper is withdrawn).</p>` }
    ],
    selfCheck: [
      { q: 'A researcher wants to study all students at IMC Krems and emails the 400 students on a club mailing list. The mailing list is the…', o: ['population', 'sampling frame', 'respondents', 'mean'], a: 1, why: 'The mailing list is the source the sample is drawn from, so it is the frame. Students who are not in the club are missing from it.' },
      { q: 'Which problem can a larger sample fix?', o: ['Coverage bias', 'Non-response bias', 'Random sampling error', 'Self-selection bias'], a: 2, why: 'Only random error shrinks with sample size. All forms of bias stay.' },
      { q: 'House prices in a town: mean €410,000, median €320,000. What does this suggest?', o: ['Prices are symmetric', 'A few very expensive houses pull the mean up', 'Most houses cost more than €410,000', 'The data must be fake'], a: 1, why: 'The mean is well above the median, so the distribution is right-skewed.' },
      { q: 'Two teams have the same mean sales, but team A has SD = 2 and team B has SD = 15. Which statement is true?', o: ['Team B sold more', 'Team A is more consistent', 'Team A sold more', 'The teams are identical'], a: 1, why: 'A smaller SD means the values are closer to the mean, so team A is more consistent.' },
      { q: 'Which histogram shape is most typical for "hours spent on social media per week"?', o: ['Uniform', 'Right-skewed', 'Left-skewed', 'Perfectly symmetric'], a: 1, why: 'Most people spend a moderate amount of time, and a few spend a lot, which creates a long right tail.' }
    ],
    sources: [
      { label: 'Salganik, Bit by Bit: the Literary Digest poll and total survey error', url: 'https://www.bitbybitbook.com/en/1st-ed/asking-questions/total-survey-error/representation/' },
      { label: 'Data Colada [98]: Evidence of fraud in an influential field experiment about dishonesty (2021)', url: 'https://datacolada.org/98' },
      { label: 'Shu et al. (2012), PNAS, retracted in 2021', url: 'https://doi.org/10.1073/pnas.1209746109' },
      { label: 'Kristal et al. (2020), PNAS: Signing at the beginning versus at the end does not decrease dishonesty', url: 'https://doi.org/10.1073/pnas.1911695117' }
    ]
  }
},

/* ================================================================
   ROOM 2 - THE LAB
   ================================================================ */
{
  id: 'r2', number: 2, title: 'The Lab',
  methods: 'Experiments, ANOVA and regression',
  story: `Last time the board exposed fabricated data in a famous honesty study. Now two business-school favourites land on the table: a TED talk claim that a two-minute "power pose" changes your hormones, and a study that says good-looking people earn more. Both are cited in HR trainings across Europe. The lab door closes behind you.`,
  locks: [
  {
    id: 'variables', title: 'The Hypothesis', tag: 'Case file PSYSCI-2010', guide: 'Variables and experiments',
    intro: `<p>In 2010 Carney, Cuddy and Yap published a study in <i>Psychological Science</i>. <b>42 participants</b> were randomly assigned to hold either two <b>high-power poses</b> (expansive, such as leaning back with feet on a desk) or two <b>low-power poses</b> (contracted, such as arms folded tight) for one minute each. Saliva samples were taken before and about 17 minutes after posing to measure testosterone and cortisol. Participants could also choose to take a gamble, and rated how powerful they felt.</p>
    <blockquote>High-power posers showed higher testosterone, lower cortisol, more risk-taking and stronger feelings of power.</blockquote>
    <p>A TED talk about the study became one of the most watched of all time.</p>`,
    task: `<p>Match the three roles to the items in the list, then enter the three numbers <b>in this order</b>: independent variable, dependent variable, technique that makes the groups comparable.</p>
    <ol class="items"><li>The change in testosterone</li><li>The pose people held (high-power or low-power)</li><li>Random assignment to the two groups</li><li>The TED talk</li><li>The room where the study took place</li></ol>`,
    format: '3 digits, e.g. 451', answer: ['213'],
    hints: ['The independent variable is what the researchers change on purpose. The dependent variable is what they measure to see the effect.', 'Researchers changed the pose and measured hormones. The code starts with 2.'],
    reveal: `<p>Because the researchers <b>changed</b> the pose and <b>randomly</b> decided who got which pose, this is an experiment. Random assignment makes the two groups similar on average, so a difference in the outcome can be blamed on the pose. That is a stronger design than a survey, but 42 people is a small sample for measuring something as noisy as hormones.</p>`,
    debrief: ['Independent variable = what you change. Dependent variable = what you measure.', 'Random assignment is what makes an experiment able to test cause and effect.']
  },
  {
    id: 'anova', title: 'The ANOVA Table', tag: 'Teaching study', guide: 'Comparing groups: t-test and ANOVA',
    intro: `<p>To train new board members, the journal's statistician runs a teaching version of the study with <b>three groups</b> of 30 people each: high-power pose, low-power pose and a control group with no pose. The outcome is self-rated confidence on a scale from 1 to 7.</p>
    {{chart:r2-means}}
    <div class="tbl-wrap"><table>
      <thead><tr><th>One-way ANOVA</th><th>Sum of squares</th><th>df</th><th>Mean square</th><th>F</th><th>p</th></tr></thead>
      <tbody>
        <tr><td>Between groups</td><td>9.6</td><td>2</td><td>4.80</td><td>3.43</td><td>.037</td></tr>
        <tr><td>Within groups</td><td>121.8</td><td>87</td><td>1.40</td><td></td><td></td></tr>
        <tr><td>Total</td><td>131.4</td><td>89</td><td></td><td></td><td></td></tr>
      </tbody>
    </table></div>
    <p class="note">Illustrative teaching data, not from the original study.</p>`,
    task: `<p>Which statements are correct readings of this output? Exactly <b>three</b> are. Enter their letters in alphabetical order.</p>
    <div class="opts">
      <div class="opt"><span class="tag">A</span><span>Because p &lt; .05, at least one group mean differs significantly from another.</span></div>
      <div class="opt"><span class="tag">B</span><span>The ANOVA alone shows that the high-power group differs from the low-power group specifically.</span></div>
      <div class="opt"><span class="tag">C</span><span>This result proves that poses change people's hormones.</span></div>
      <div class="opt"><span class="tag">D</span><span>F compares how much the group means differ with how much people differ within each group.</span></div>
      <div class="opt"><span class="tag">E</span><span>If poses had no effect at all, differences this large would turn up in only about 4% of studies like this.</span></div>
      <div class="opt"><span class="tag">F</span><span>p = .037 means there is a 3.7% chance that the hypothesis is true.</span></div>
    </div>`,
    format: '3 letters, e.g. BCF', answer: ['ADE'],
    hints: ['This study measured self-rated confidence, not hormones. And an ANOVA only tells you that some difference exists somewhere.', 'The p-value is about the data, assuming there is no effect. It is not the probability that the hypothesis is true.'],
    reveal: `<p>An ANOVA answers one question: are the group means more different than you would expect by chance? To find out <b>which</b> groups differ, you need follow-up (post-hoc) tests. Also notice the size: the groups differ by less than one point on a 7-point scale, and the pose explains only about 7% of the variation in confidence (9.6 out of 131.4).</p>`,
    debrief: ['Use a t-test for two groups and an ANOVA for three or more.', 'p < .05 means "unlikely if there were no effect". It does not mean "important" or "proven".']
  },
  {
    id: 'replication', title: 'The Replication', tag: 'Case file PSYSCI-2015', guide: 'Significance, sample size and replication',
    intro: `<p>In 2015 Ranehill and colleagues repeated the power pose experiment with <b>200 participants</b>, almost five times as many, again with random assignment. The experimenter did not know which pose each person had held.</p>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Outcome</th><th>Carney et al. 2010 (n = 42)</th><th>Ranehill et al. 2015 (n = 200)</th></tr></thead>
      <tbody>
        <tr><td>T: Testosterone</td><td>higher, p &lt; .05</td><td>no difference, p = .16</td></tr>
        <tr><td>C: Cortisol</td><td>lower, p &lt; .05</td><td>no difference, p = .27</td></tr>
        <tr><td>R: Risk-taking</td><td>higher, p &lt; .05</td><td>no difference, p = .22</td></tr>
        <tr><td>P: Feeling powerful</td><td>higher, p &lt; .05</td><td>higher, p = .017</td></tr>
      </tbody>
    </table></div>
    <p>In 2016 Dana Carney, the first author of the original study, published a statement saying she no longer believed the effects of power posing were real.</p>`,
    task: `<p>The board must rule on the 2010 claims. Which ruling fits the evidence in the table best?</p>
    <div class="opts">
      <div class="opt"><span class="tag">K</span><span>Keep all claims. The original found significant effects, and a significant result is final.</span></div>
      <div class="opt"><span class="tag">C</span><span>Correct. Keep only the claim that people <i>feel</i> more powerful, and drop the claims about hormones and risk-taking.</span></div>
      <div class="opt"><span class="tag">R</span><span>Retract for fraud. A failed replication proves the data were invented.</span></div>
      <div class="opt"><span class="tag">X</span><span>Retract. The replication shows that every claim is false.</span></div>
    </div>`,
    format: '1 letter', answer: ['C'],
    hints: ['Look at the last column row by row. Which outcome was still significant in the larger study?', 'Nobody has shown fabricated data in this case. A failed replication is not proof of fraud.'],
    reveal: `<p>The larger study only confirmed that people <b>feel</b> more powerful after posing. Small samples with noisy measurements, such as hormones, often produce significant results that later disappear. A bigger sample gives a more trustworthy answer.</p>`,
    debrief: ['Small samples plus noisy measures often produce false positives.', 'Replication can keep part of a claim and drop the rest. That is a correction, not a retraction.']
  },
  {
    id: 'regression', title: 'The Beauty Premium', tag: 'Case file AER-1994', guide: 'Reading a regression table',
    intro: `<p>Economists Daniel Hamermesh and Jeff Biddle (1994, <i>American Economic Review</i>) used large surveys from the US and Canada in which interviewers rated each respondent's looks on a 5-point scale. They then used <b>regression</b> to compare the hourly wages of people with below-average, average and above-average looks. Their headline: "The penalty for plainness is 5 to 10 percent, slightly larger than the premium for beauty."</p>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Outcome: hourly wage</th><th>Model 1</th><th>Model 2</th></tr></thead>
      <tbody>
        <tr><td>Below-average looks</td><td>−12% **</td><td>−8% **</td></tr>
        <tr><td>Above-average looks</td><td>+6% *</td><td>+5% *</td></tr>
        <tr><td>Each extra year of education</td><td></td><td>+7% **</td></tr>
        <tr><td>Each extra year of work experience</td><td></td><td>+2% **</td></tr>
        <tr><td>Other controls (gender, union member, region…)</td><td>no</td><td>yes</td></tr>
        <tr><td>R²</td><td>.02</td><td>.38</td></tr>
      </tbody>
    </table></div>
    <p class="note">Illustrative teaching output in the spirit of the paper. Coefficients are shown as percent differences in wages compared with workers of <b>average</b> looks. * p &lt; .05, ** p &lt; .01.</p>`,
    task: `<p>According to <b>Model 2</b>, how many percent less do workers with below-average looks earn than workers with average looks, when education, experience and the other controls are the same?</p>`,
    format: 'a number, e.g. 3', answer: ['8', '-8', '8%', '-8%'],
    hints: ['Find the row "Below-average looks" and the column "Model 2".', 'The comparison group is average-looking workers, which is why there is no row for them.'],
    reveal: `<p>Each <b>coefficient</b> tells you how much the outcome changes for one group or one unit, holding the other variables in the model constant. Comparing the two models shows that part of the gap in Model 1 was really about education and experience, so <b>controls</b> matter.</p>`,
    debrief: ['A regression coefficient is the expected change in the outcome, holding the other variables constant.', 'Adding controls can shrink a relationship, which shows how much of it came from other factors.']
  },
  {
    id: 'causation', title: 'Correlation or Cause?', tag: 'Board ruling', guide: 'Correlation, causation and controls',
    intro: `<p>An HR consultancy wants to quote the beauty study in a training brochure. Before the board approves, it checks what the regression can and cannot support.</p>`,
    task: `<p>Which conclusions can the board sign off? Exactly <b>three</b> are justified. Enter their letters in alphabetical order.</p>
    <div class="opts">
      <div class="opt"><span class="tag">A</span><span>After controlling for education and experience, the gap for below-average looks gets smaller but does not disappear.</span></div>
      <div class="opt"><span class="tag">B</span><span>Model 2 explains much more of the differences in wages than Model 1 (R² .38 versus .02).</span></div>
      <div class="opt"><span class="tag">C</span><span>The study proves that employers discriminate against plain-looking people.</span></div>
      <div class="opt"><span class="tag">D</span><span>Looks explain most of the differences in people's wages.</span></div>
      <div class="opt"><span class="tag">E</span><span>Something not in the model, such as self-confidence, could explain part of the gap.</span></div>
      <div class="opt"><span class="tag">F</span><span>Because the sample is large, the relationship must be causal.</span></div>
    </div>`,
    format: '3 letters, e.g. CDF', answer: ['ABE'],
    hints: ['R² tells you how much of the variation the model explains. Looks alone (Model 1) explain only 2%.', 'A survey cannot prove why something happens. Discrimination is one possible explanation, but not the only one.'],
    reveal: `<p><b>Room cleared.</b> The board keeps the beauty study: the relationship is robust and has been found again in later research. But the brochure must not say "looks cause higher pay". Discrimination is one explanation, and others include confidence, health and the jobs people choose. Unlike power posing, nothing here needs correcting, only careful wording.</p>`,
    debrief: ['Correlation does not prove causation. Ask what else could explain the relationship (omitted variables).', 'R² shows how much of the variation the model explains, and a small R² can still go with a significant coefficient.']
  }],
  test: [
    { q: 'In an experiment testing whether background music increases spending in a shop, the dependent variable is…', o: ['the music', 'the amount customers spend', 'the shop', 'random assignment'], a: 1 },
    { q: 'What does random assignment to groups achieve?', o: ['It makes the sample bigger', 'It makes groups similar on average, so differences can be blamed on the treatment', 'It guarantees a significant result', 'It removes the need for a control group'], a: 1 },
    { q: 'You want to compare average customer satisfaction across four store locations. Which method fits?', o: ['Regression with one predictor', 'A one-way ANOVA', 'A histogram', 'A focus group'], a: 1 },
    { q: 'An ANOVA gives p = .003. What does that tell you?', o: ['Which group has the highest mean', 'That at least one group mean differs from the others more than chance would explain', 'That the effect is large and important', 'That there is a 0.3% chance the result is true'], a: 1 },
    { q: 'A small study finds a significant effect, but a much larger replication does not. The most reasonable conclusion is…', o: ['The original authors cheated', 'The larger study must be wrong', 'The original effect was probably smaller than reported or a fluke', 'Sample size does not matter'], a: 2 },
    { q: 'In a regression of salary (€) on years of experience, the coefficient for experience is 1,200. This means…', o: ['Everyone earns €1,200', 'Each extra year of experience goes with €1,200 more salary on average', 'Experience causes a €1,200 pay rise', '1,200 people were in the sample'], a: 1 },
    { q: 'A model has R² = .05. Which statement is correct?', o: ['The model explains 5% of the variation in the outcome', 'The result is not significant', 'The model is 95% wrong', '5% of the sample was used'], a: 0 },
    { q: 'Cities with more ice cream sales have more drownings. Why should you not conclude that ice cream causes drowning?', o: ['The sample is too small', 'A third variable, hot weather, could drive both', 'Drownings are hard to measure', 'Correlations are always zero'], a: 1 }
  ],
  guide: {
    minutes: 30,
    goals: ['Name the independent and dependent variable in an experiment', 'Explain why random assignment matters', 'Read an ANOVA table and a p-value correctly', 'Read a regression coefficient and R²', 'Explain why correlation is not causation'],
    sections: [
    { h: 'Variables and experiments', html: `
      <p>A <b>variable</b> is anything that can take different values: age, price, satisfaction, pose.</p>
      <ul>
        <li><b>Independent variable (IV):</b> what the researcher changes or compares, the possible cause. Example: the price shown in an online shop.</li>
        <li><b>Dependent variable (DV):</b> what is measured to see the effect. Example: whether the visitor buys.</li>
        <li><b>Hypothesis:</b> a testable prediction about how the IV affects the DV. Example: "A lower price increases the share of visitors who buy."</li>
      </ul>
      <p>In an <b>experiment</b> the researcher actively changes the IV and uses <b>random assignment</b>: chance decides who gets which version. Random assignment makes the groups similar on average in everything else (age, mood, income), so if the groups end up different, the IV is the most likely cause. A <b>control group</b> gets no treatment or the usual version, so you can see what would have happened anyway.</p>
      <div class="example"><b>Worked example.</b> An online shop shows half of its visitors (chosen at random) a green "Buy" button and the other half a red one. IV: button colour. DV: share of visitors who buy. Because chance decided who saw which colour, a difference in buying can be blamed on the colour. Companies call this an A/B test.</div>` },
    { h: 'Comparing groups: t-test and ANOVA', html: `
      <p>When you compare the average of a variable across groups, you need to know whether the difference is real or could have happened by chance.</p>
      <ul>
        <li><b>t-test:</b> compares the means of <b>two</b> groups.</li>
        <li><b>One-way ANOVA</b> (analysis of variance): compares the means of <b>three or more</b> groups at once.</li>
      </ul>
      <p>An ANOVA compares two kinds of variation. <b>Between groups</b> is how far the group means are from each other. <b>Within groups</b> is how much individuals differ inside each group. The <b>F</b> value is the ratio between them: a large F means the groups differ more than the normal individual variation would suggest.</p>
      <p><b>How to read an ANOVA table:</b> look at F and p in the "between groups" row. If p &lt; .05, at least one group mean differs from another. The ANOVA does not tell you which ones, so researchers follow up with post-hoc tests.</p>
      <div class="example"><b>Worked example.</b> A retailer compares customer satisfaction (1–10) in Vienna, Graz and Linz: means 7.1, 7.4 and 6.2, F = 5.8, p = .004. Reading: the satisfaction differs between cities more than chance would explain. Linz looks lowest, but a post-hoc test would confirm which pairs differ.</div>` },
    { h: 'Significance, sample size and replication', html: `
      <p>The <b>p-value</b> answers one question: <i>if there were really no effect, how often would we see a difference at least this large just by chance?</i> By convention, p &lt; .05 (less than 5%) is called <b>statistically significant</b>.</p>
      <p>Three common mistakes:</p>
      <ul>
        <li>p is <b>not</b> the probability that the hypothesis is true.</li>
        <li>Significant does <b>not</b> mean large or important. With huge samples, tiny differences become significant. Always look at the size of the difference (the <b>effect size</b>).</li>
        <li>Not significant does <b>not</b> prove there is no effect; the study may have been too small to detect it.</li>
      </ul>
      <p><b>Small samples</b> are risky: by chance, they sometimes show big effects that are not real. If researchers measure many outcomes and report the ones that "worked", the risk grows. That is why a <b>replication</b> with a larger sample is the best test of a surprising claim.</p>` },
    { h: 'Reading a regression table', html: `
      <p><b>Regression</b> estimates how an outcome (the dependent variable) changes with one or more predictors. You can picture a simple regression as the best-fitting straight line through a scatter plot.</p>
      <ul>
        <li><b>Coefficient:</b> how much the outcome changes when the predictor goes up by one unit, or for one group compared with a reference group. Example: a coefficient of +7% for each year of education means that each extra year goes with about 7% higher wages.</li>
        <li><b>Reference group:</b> for categories (such as looks: below average, average, above average), one category is left out and the others are compared with it.</li>
        <li><b>Stars or p-values:</b> show whether a coefficient is statistically significant.</li>
        <li><b>R²:</b> the share of the variation in the outcome that the model explains, from 0 to 1. R² = .38 means 38%.</li>
        <li><b>Controls:</b> extra variables in the model. A coefficient then means "holding the controls constant", which is like comparing people with the same education and experience.</li>
      </ul>
      <div class="example"><b>Worked example.</b> A regression of monthly sales on advertising budget gives: advertising (per €1,000) = +€4,500 **, R² = .41. Reading: each extra €1,000 in advertising goes with about €4,500 more sales on average, the relationship is significant, and the model explains 41% of the variation in sales.</div>` },
    { h: 'Correlation, causation and controls', html: `
      <p>Survey and observational data show that two things move together (<b>correlation</b>). They do not prove that one <b>causes</b> the other. There are three alternative explanations:</p>
      <ul>
        <li><b>Third variable (confounder):</b> something else drives both. Ice cream sales and drownings both rise in hot weather.</li>
        <li><b>Reverse causation:</b> the effect runs the other way. Do happy employees perform better, or does performing well make people happy?</li>
        <li><b>Selection:</b> the groups were different from the start. People who choose a training course may be more motivated anyway.</li>
      </ul>
      <p>Adding <b>controls</b> to a regression rules out some of these explanations, but only for the variables you measured. Anything not in the data (an <b>omitted variable</b>) can still play a role. Only an experiment with random assignment can test cause and effect directly.</p>` }
    ],
    selfCheck: [
      { q: 'A university tests whether recorded lectures improve exam results by randomly giving half of the students access. The independent variable is…', o: ['exam results', 'access to recorded lectures', 'the university', 'random assignment'], a: 1, why: 'Access is what the researchers change. Exam results are what they measure.' },
      { q: 'You compare average order values for three website designs. Which test do you use?', o: ['t-test', 'one-way ANOVA', 'regression with R² only', 'no test needed'], a: 1, why: 'Three or more group means call for an ANOVA.' },
      { q: 'A huge study (n = 500,000) finds that a new app layout increases time on the app by 2 seconds, p < .001. Which is true?', o: ['The effect is large', 'The effect is significant but tiny', 'The result is a mistake', 'p-values do not work with large samples'], a: 1, why: 'Large samples make small effects significant. Always check the size of the difference.' },
      { q: 'In a regression of salary on gender and experience, the coefficient for "female" is −6%. The reference group is…', o: ['women', 'men', 'experience', 'all employees'], a: 1, why: 'The left-out category is the comparison group, so women are compared with men of the same experience.' },
      { q: 'Employees who attend a voluntary leadership course get promoted more often. What is the best caution?', o: ['The course clearly causes promotions', 'More motivated people may choose the course (selection)', 'Promotions cannot be measured', 'The sample must be fake'], a: 1, why: 'People who choose a voluntary course may differ from those who don\'t, so selection is an alternative explanation.' }
    ],
    sources: [
      { label: 'Carney, Cuddy & Yap (2010), Psychological Science', url: 'https://doi.org/10.1177/0956797610383437' },
      { label: 'Ranehill et al. (2015), Psychological Science: replication with 200 participants', url: 'https://doi.org/10.1177/0956797614553946' },
      { label: 'Hamermesh & Biddle (1994), Beauty and the Labor Market (NBER working paper)', url: 'https://www.nber.org/papers/w4518' }
    ]
  }
},

/* ================================================================
   ROOM 3 - THE FACTORY FLOOR
   ================================================================ */
{
  id: 'r3', number: 3, title: 'The Factory Floor',
  methods: 'Observation and interviews',
  story: `The numbers rooms are behind you. The next file is the most famous case in management history: the Hawthorne studies at Western Electric near Chicago (1924–1932). Every management textbook tells the story. The board must find out how much of it the evidence really supports. This time the evidence is not tables but notes and conversations.`,
  locks: [
  {
    id: 'lights', title: 'Lights On', tag: 'Case file HAWTHORNE-1924', guide: 'Observation and the observer effect',
    intro: `<p>From 1924, engineers at the Hawthorne Works tested whether better lighting would make factory workers more productive. A <b>test group</b> worked under changing light levels, and a <b>control group</b> worked under constant light. Textbooks usually tell the result like the chart below: output went up in both groups, even when the light was turned down.</p>
    <figure>{{chart:r3-legend}}<figcaption>The illumination studies as textbooks usually tell them (a drawing of the legend, not real data)</figcaption></figure>`,
    task: `<p>Assume for now that the textbook story is true. Which conclusions follow from it? Exactly <b>three</b> are justified. Enter their letters in alphabetical order.</p>
    <div class="opts">
      <div class="opt"><span class="tag">A</span><span>Output rose in both groups, so the lighting alone cannot explain the rise.</span></div>
      <div class="opt"><span class="tag">B</span><span>Being part of a study and being watched may itself have changed how people worked.</span></div>
      <div class="opt"><span class="tag">C</span><span>The control group shows that light has a strong effect on output.</span></div>
      <div class="opt"><span class="tag">D</span><span>A control group is useful because it shows what happens without the change.</span></div>
      <div class="opt"><span class="tag">E</span><span>The chart proves that workers prefer dim light.</span></div>
      <div class="opt"><span class="tag">F</span><span>This is an interview study.</span></div>
    </div>`,
    format: '3 letters, e.g. CEF', answer: ['ABD'],
    hints: ['If output rose under constant light too, what does that say about the light?', 'The idea that people change their behaviour because they know they are being studied later became known as the "Hawthorne effect".'],
    reveal: `<p>This is the origin of the <b>Hawthorne effect</b>: people may behave differently because they know they are being observed. Every observer needs to think about how their presence changes what they see. But remember: you were told to assume the textbook story is true. The board will come back to that.</p>`,
    debrief: ['Observer effect (Hawthorne effect): being observed can change behaviour.', 'A control group shows what would have happened anyway.']
  },
  {
    id: 'watching', title: 'Ways of Watching', tag: 'Case file HAWTHORNE-1931', guide: 'Four kinds of observation',
    intro: `<p>In the <b>Bank Wiring Observation Room</b> (1931–1932), 14 men who wired telephone equipment were moved into a separate room. A researcher sat in the room for months, taking notes on everything that happened. The men knew who he was, but he did not take part in the work or give orders.</p>
    <p>Observation studies differ in two ways: does the researcher <b>take part</b> in the activity (participant or non-participant), and do the people <b>know</b> they are being studied (overt or covert)?</p>
    <div class="facts">
      <div class="fact"><div class="v">A</div><div class="k">overt participant</div></div>
      <div class="fact"><div class="v">B</div><div class="k">overt non-participant</div></div>
      <div class="fact"><div class="v">C</div><div class="k">covert participant</div></div>
      <div class="fact"><div class="v">D</div><div class="k">covert non-participant</div></div>
    </div>`,
    task: `<p>Classify each study with a letter from A to D. Enter the four letters in the order of the studies.</p>
    <ol class="items">
      <li>The Bank Wiring Room researcher described above.</li>
      <li>A researcher takes a job as a waiter in a Vienna restaurant, without telling colleagues, to study how tips are shared.</li>
      <li>A retail analyst watches anonymous customers in a supermarket from a balcony and counts how many look at the top shelf.</li>
      <li>A student joins a start-up as an intern for three months, with the team's knowledge, and writes field notes about how decisions are made.</li>
    </ol>`,
    format: '4 letters, e.g. DCBA', answer: ['BCDA'],
    hints: ['Ask two questions for each study: does the researcher do the same activity as the people studied, and do the people know?', 'The Bank Wiring researcher did not work on the equipment, and the men knew him, so study 1 is B.'],
    reveal: `<p>Each type has trade-offs. <b>Covert</b> observation avoids the observer effect but raises ethical problems, because people have not agreed to be studied. <b>Participant</b> observation gives an insider view but makes it hard to stay neutral. Today, covert observation needs strong justification and ethics approval.</p>`,
    debrief: ['Participant or non-participant: does the researcher join the activity?', 'Overt or covert: do people know they are studied? Covert research raises consent issues.']
  },
  {
    id: 'notes', title: 'The Field Notes', tag: 'Case file HAWTHORNE-1931', guide: 'Field notes and coding',
    intro: `<p>The Bank Wiring researcher found something management had not expected: the men had their own <b>unwritten rules</b>. A man who worked too fast was a "rate-buster", one who worked too slowly was a "chiseler", and anyone who told a supervisor was a "squealer". The group enforced these rules itself.</p>
    <p>Below are field notes written in the style of the study.</p>
    <ol class="items notes">
      <li>08:10 W3 and W5 start wiring. Steady pace, talking about baseball.</li>
      <li>09:25 W2 finishes his third unit early. W6 calls out "Slow down, Speed King" and the others laugh. W2 stops and lights a cigarette.</li>
      <li>10:40 The supervisor walks through. Everyone works quietly until he leaves.</li>
      <li>11:15 W8 says to the observer: "Two units a day is a fair day's work. Nobody here does more."</li>
      <li>13:05 W2 is working fast again. W4 walks over and hits him hard on the upper arm ("binging"). W2 slows down.</li>
      <li>14:30 W1 reports a broken tool to the supervisor. Afterwards nobody speaks to W1 for the rest of the afternoon.</li>
      <li>15:20 The group stops working 20 minutes before the end of the shift. Output for the day is reported as "two units each".</li>
    </ol>
    <p class="note">Illustrative field notes written for teaching, based on the behaviours reported by Roethlisberger and Dickson (1939).</p>`,
    task: `<p>Code the notes. Which lines show a <b>sanction</b>: the group punishing someone for breaking its unwritten rules? Enter the line numbers in ascending order.</p>`,
    format: 'line numbers, e.g. 147', answer: ['256'],
    hints: ['A sanction is a reaction to someone breaking the rules: mocking, hitting or ignoring them. A statement of the rule itself (line 4) is not a sanction.', 'Look for three lines where someone else reacts to W1 or W2.'],
    reveal: `<p>Coding means attaching labels to pieces of data. Here you could code <b>norm</b> (lines 4 and 7), <b>sanction</b> (2, 5 and 6) and <b>reaction to management</b> (3). Grouping codes into themes leads to a finding: <b>informal groups set their own output norms and enforce them</b>. No survey would have found this, because nobody would admit it on a questionnaire.</p>`,
    debrief: ['Field notes should describe what happened (who, what, when) separately from the observer\'s interpretation.', 'Coding attaches labels to pieces of text, and grouping codes into themes produces findings.']
  },
  {
    id: 'interview', title: 'The Interview', tag: 'Case file HAWTHORNE-1928', guide: 'Interviews and question design',
    intro: `<p>From 1928 the researchers interviewed more than <b>20,000 workers</b>. They started with direct questions about working conditions, but workers kept talking about other things. So they switched to a <b>non-directive</b> style: let the person talk, listen, and avoid steering. Compare two interviewers:</p>
    <div class="charts">
      <figure><figcaption><b>Interviewer A</b></figcaption><ol class="items small">
        <li>"You're happy with the new rest breaks, aren't you?"</li>
        <li>"How long have you worked in this department?"</li>
        <li>"Is your supervisor fair and friendly?"</li>
      </ol></figure>
      <figure><figcaption><b>Interviewer B</b></figcaption><ol class="items small" start="4">
        <li>"Most workers say the new pay system is unfair. Do you agree?"</li>
        <li>"Tell me about a typical day in your group."</li>
        <li>"You mentioned the older men. What do you mean by that?"</li>
      </ol></figure>
    </div>
    <p class="note">Illustrative questions written for teaching.</p>`,
    task: `<p>Which questions are <b>badly designed</b> because they are leading (they push towards an answer) or double-barrelled (they ask two things at once)? Enter their numbers in ascending order.</p>`,
    format: 'question numbers, e.g. 256', answer: ['134'],
    hints: ['A leading question suggests what the "right" answer is. "…aren\'t you?" and "Most people say…" are classic signs.', 'Can a supervisor be fair but not friendly? Then one question asks two things.'],
    reveal: `<p>Questions 5 and 6 are good open questions: 5 invites a story, and 6 is a <b>probe</b> that asks the person to explain in their own words. Question 2 is a fine factual question. Interviewers A and B both made mistakes, so the skill is in each question, not the person.</p>`,
    debrief: ['Open questions and probes let people answer in their own words. Leading and double-barrelled questions distort answers.', 'Structured interviews are easy to compare. Unstructured (non-directive) interviews discover things you did not think to ask.']
  },
  {
    id: 'legend', title: 'The Legend', tag: 'Board ruling', guide: 'Quality in qualitative research',
    intro: `<p>In 2011 economists Steven Levitt and John List found the original illumination data, which were long thought to have been destroyed, and analysed them properly for the first time. Their conclusion: the famous descriptions of the data "prove to be entirely fictional". There were only hints of a much smaller, subtler effect. The tidy chart from lock 1 was a legend.</p>
    <p>The Bank Wiring observations and the interview programme, however, are well documented in the original report by Roethlisberger and Dickson (1939).</p>`,
    task: `<p>What should the board rule about the textbook story of the Hawthorne studies?</p>
    <div class="opts">
      <div class="opt"><span class="tag">K</span><span>Keep. The story is famous and appears in every textbook, so it must be right.</span></div>
      <div class="opt"><span class="tag">C</span><span>Correct. Keep the documented findings about group norms and interviewing, and drop the claim that output rose with every change in light.</span></div>
      <div class="opt"><span class="tag">R</span><span>Retract everything. If one part was exaggerated, all the Hawthorne research is worthless.</span></div>
      <div class="opt"><span class="tag">X</span><span>Keep, because observation studies cannot be checked anyway.</span></div>
    </div>`,
    format: '1 letter', answer: ['C'],
    hints: ['The board should judge each claim on its own evidence.', 'Which parts are documented, and which part was shown to be a legend?'],
    reveal: `<p><b>Room cleared.</b> The observer effect is still a real concern in research, but its most famous "proof" was retold until it became a myth. The lasting value of Hawthorne is in the qualitative work: careful observation and open interviews showed that informal groups shape behaviour at work. Good qualitative research is judged by how <b>credible, transparent and well documented</b> it is, and the Bank Wiring study was all three.</p>`,
    debrief: ['Famous is not the same as well supported. Go back to the original evidence.', 'Qualitative quality criteria: credibility, transparency (an audit trail), reflexivity and transferability.']
  }],
  test: [
    { q: 'The Hawthorne (observer) effect means…', o: ['people work harder in bright light', 'people may change their behaviour because they know they are being studied', 'observers always make mistakes', 'interviews are better than surveys'], a: 1 },
    { q: 'A researcher joins a football fan club, openly as a researcher, and attends matches with the members. This is…', o: ['covert participant observation', 'overt participant observation', 'overt non-participant observation', 'a structured interview'], a: 1 },
    { q: 'What is the main ethical problem with covert observation?', o: ['It is too expensive', 'People have not given consent to be studied', 'It only works in factories', 'It produces numbers instead of words'], a: 1 },
    { q: 'Which is the best example of descriptive field notes?', o: ['"The team is lazy."', '"At 10:15, two of five team members left the meeting; the manager kept talking."', '"I think the manager is a bad leader."', '"Everyone was unhappy."'], a: 1 },
    { q: 'In qualitative analysis, coding means…', o: ['writing software', 'attaching labels to pieces of text or observations', 'converting answers into a regression', 'hiding participants\' names'], a: 1 },
    { q: '"Don\'t you agree that our new app is easy to use?" is a…', o: ['open question', 'probe', 'leading question', 'neutral factual question'], a: 2 },
    { q: 'When is an unstructured (non-directive) interview most useful?', o: ['When you need to compare exact answers from 1,000 people', 'When you want to discover issues you did not expect', 'When you want to test a hypothesis statistically', 'Never'], a: 1 },
    { q: 'Levitt and List (2011) re-analysed the original Hawthorne illumination data. What did they find?', o: ['The textbook story was exactly right', 'The famous data pattern was largely a myth', 'The data were fabricated by workers', 'Lighting doubled productivity'], a: 1 }
  ],
  guide: {
    minutes: 25,
    goals: ['Name the four types of observation and their trade-offs', 'Explain the observer (Hawthorne) effect', 'Tell descriptive field notes from interpretation, and code simple notes', 'Recognise good and bad interview questions', 'Explain how the quality of qualitative research is judged'],
    sections: [
    { h: 'Observation and the observer effect', html: `
      <p><b>Observation</b> means watching and recording what people actually do, instead of asking them what they do. That matters because people often do not know, do not remember, or would not admit what they really do.</p>
      <p>Observation can be <b>structured</b> (the researcher counts specific behaviours with a checklist, for example how many customers pick up a product) or <b>unstructured</b> (the researcher writes down everything that seems relevant and looks for patterns later).</p>
      <p>The <b>observer effect</b>, often called the Hawthorne effect, means that people may behave differently because they know they are being watched. Researchers reduce it by staying a long time (people get used to the observer), by being as unobtrusive as possible, or in some cases by observing covertly.</p>` },
    { h: 'Four kinds of observation', html: `
      <div class="tbl-wrap"><table class="left">
        <thead><tr><th></th><th>People know (overt)</th><th>People don't know (covert)</th></tr></thead>
        <tbody>
          <tr><td><b>Researcher takes part</b> (participant)</td><td>An intern who openly studies the team they work in</td><td>A researcher who takes a job without revealing they are studying colleagues</td></tr>
          <tr><td><b>Researcher only watches</b> (non-participant)</td><td>An observer who sits in a meeting, introduced as a researcher</td><td>Counting shoppers' behaviour from a distance; analysing CCTV footage</td></tr>
        </tbody>
      </table></div>
      <ul>
        <li><b>Participant</b> observation gives an insider view, but the researcher may "go native" and lose distance.</li>
        <li><b>Covert</b> observation avoids the observer effect, but people have not agreed to take part. Today it needs strong justification and approval by an ethics committee, and data must be anonymised.</li>
      </ul>` },
    { h: 'Field notes and coding', html: `
      <p><b>Field notes</b> are the observer's record. Good field notes separate two things:</p>
      <ul>
        <li><b>Description:</b> what happened, as concretely as possible: who, what, when, where. "At 10:15, two of the five team members left the meeting."</li>
        <li><b>Interpretation:</b> what the observer thinks it means, clearly marked as such. "My impression: the team does not take the meeting seriously."</li>
      </ul>
      <p><b>Coding</b> is how qualitative researchers analyse notes and transcripts. In <b>thematic analysis</b> you:</p>
      <ol>
        <li>Read the data several times to get to know it.</li>
        <li>Attach short labels (codes) to meaningful pieces, such as "complaint about workload" or "joke about management".</li>
        <li>Group similar codes into broader <b>themes</b>, such as "informal resistance to management".</li>
        <li>Check the themes against the data and describe them with quotes as evidence.</li>
      </ol>
      <div class="example"><b>Worked example.</b> Notes from a call centre: (1) "Agent A tells B to stop chasing extra sales: 'You make us look bad.'" (2) "The team leader praises B in front of everyone." (3) "At lunch, nobody sits with B." Codes: (1) norm stated, (2) management reward, (3) social exclusion. Theme: the team punishes members who outperform the group norm.</div>` },
    { h: 'Interviews and question design', html: `
      <p>Interviews can be more or less structured:</p>
      <ul>
        <li><b>Structured:</b> the same questions in the same order for everyone, often with fixed answer options. Easy to compare, but you only learn what you thought to ask.</li>
        <li><b>Semi-structured:</b> an interview guide with key questions, but the interviewer can change the order and ask follow-ups. This is the most common form in business research.</li>
        <li><b>Unstructured (non-directive):</b> the interviewer suggests a topic and lets the person talk. Good for exploring new areas.</li>
      </ul>
      <p><b>Good questions</b> are open ("Tell me about…", "How did you…") and are followed by <b>probes</b> ("What do you mean by that?", "Can you give an example?").</p>
      <p><b>Bad questions</b> to avoid:</p>
      <ul>
        <li><b>Leading:</b> "You liked the training, didn't you?" or "Most people say…, do you agree?"</li>
        <li><b>Double-barrelled:</b> "Is the course useful and well organised?" (two questions in one).</li>
        <li><b>Jargon-heavy or vague:</b> "How do you rate the omnichannel CX?"</li>
      </ul>
      <p>Interviews are usually recorded (with consent), transcribed and then coded like field notes.</p>` },
    { h: 'Quality in qualitative research', html: `
      <p>Qualitative research is not judged by sample size or p-values. Instead researchers ask:</p>
      <ul>
        <li><b>Credibility:</b> do the findings fit the data? Are there enough quotes and examples? Were participants or other researchers asked to check the interpretation?</li>
        <li><b>Transparency:</b> can a reader follow how the researcher got from data to conclusions (an "audit trail")?</li>
        <li><b>Reflexivity:</b> does the researcher reflect on how their own role, background and presence may have shaped the data?</li>
        <li><b>Transferability:</b> is the setting described in enough detail for readers to judge whether the findings may apply elsewhere?</li>
      </ul>
      <p>The Hawthorne case also teaches a general lesson: a story that is retold often enough can drift away from its evidence. Always ask what the original data actually showed.</p>` }
    ],
    selfCheck: [
      { q: 'A researcher analyses anonymous videos of how customers move through IKEA without them knowing. This is…', o: ['overt participant', 'covert non-participant', 'overt non-participant', 'a focus group'], a: 1, why: 'The researcher does not take part, and the customers do not know they are studied.' },
      { q: 'Which line from field notes is description rather than interpretation?', o: ['"The manager is arrogant."', '"The manager interrupted three speakers in ten minutes."', '"The team clearly dislikes her."', '"It was a bad meeting."'], a: 1, why: 'It records concretely what happened. The others are judgements.' },
      { q: 'What is the step after attaching codes in thematic analysis?', o: ['Running an ANOVA', 'Grouping codes into broader themes', 'Deleting unusual cases', 'Writing the questionnaire'], a: 1, why: 'Codes are grouped into themes, which are then checked against the data.' },
      { q: '"How satisfied are you with the pay and the working hours?" is…', o: ['an open question', 'double-barrelled', 'a probe', 'a perfect question'], a: 1, why: 'It asks about two things at once, so the answer is impossible to interpret.' },
      { q: 'Reflexivity means…', o: ['repeating the study', 'the researcher reflecting on how they may have influenced the research', 'using reflective materials in the lab', 'asking the same question twice'], a: 1, why: 'Reflexivity is the researcher\'s honest look at their own influence on the data and the interpretation.' }
    ],
    sources: [
      { label: 'Levitt & List (2011): Was there really a Hawthorne effect at the Hawthorne plant?', url: 'https://doi.org/10.1257/app.3.1.224' },
      { label: 'NBER working paper version of Levitt & List', url: 'https://www.nber.org/papers/w15016' },
      { label: 'The Psychologist: Walking through snow to get to work (on the Hawthorne studies)', url: 'https://bps.org.uk/psychologist/walking-through-snow-get-work' }
    ]
  }
},

/* ================================================================
   ROOM 4 - THE BOARDROOM
   ================================================================ */
{
  id: 'r4', number: 4, title: 'The Boardroom',
  methods: 'Focus groups, mixed methods and the final verdict',
  story: `The final session. The press conference is tonight. On the table are two business classics: Coca-Cola's decision to replace its 99-year-old recipe in 1985, and a jam-tasting study that every marketing course quotes. The board will need everything it has learned: numbers, observation, interviews and now focus groups.`,
  locks: [
  {
    id: 'siptest', title: 'The Sip Test', tag: 'Case file COKE-1985', guide: 'What does a measure really measure?',
    intro: `<p>In the early 1980s Pepsi was gaining ground with its "Pepsi Challenge": blind taste tests in which many people preferred Pepsi's sweeter taste. Coca-Cola developed a new, sweeter formula and tested it in about <b>200,000 blind taste tests</b>. The new formula beat both old Coke and Pepsi.</p>
    <p>On 23 April 1985 Coca-Cola launched <b>New Coke</b> and stopped making the original. The public reaction was furious. The company's hotline went from about 400 calls a day to more than 1,500, and it received over 40,000 angry calls and letters. On 11 July, just <b>79 days</b> later, the company announced the return of the original as "Coca-Cola Classic".</p>`,
    task: `<p>Which statements about the taste tests are correct? Exactly <b>three</b> are. Enter their letters in alphabetical order.</p>
    <div class="opts">
      <div class="opt"><span class="tag">A</span><span>Blind sip tests measured which taste people preferred in a small sip.</span></div>
      <div class="opt"><span class="tag">B</span><span>The sip tests measured how customers would feel about losing the original Coke.</span></div>
      <div class="opt"><span class="tag">C</span><span>A sweeter drink can win a sip test but be less pleasant over a whole can.</span></div>
      <div class="opt"><span class="tag">D</span><span>Hiding the brand removed part of what customers actually buy.</span></div>
      <div class="opt"><span class="tag">E</span><span>Because 200,000 people were tested, the decision had to be right.</span></div>
      <div class="opt"><span class="tag">F</span><span>Blind taste tests are a form of qualitative research.</span></div>
    </div>`,
    format: '3 letters, e.g. BEF', answer: ['ACD'],
    hints: ['Remember the Literary Digest: a huge sample does not help if you measure the wrong thing.', 'People were asked "Which sip tastes better?" not "Should we stop selling the Coke you know?"'],
    reveal: `<p>This is a problem of <b>validity</b>: does a measure capture what you really want to know? The sip tests measured taste in a tiny sip with no brand. The real question was how people would react to losing a brand they felt attached to. Numbers can be precise and still answer the wrong question.</p>`,
    debrief: ['Validity: does the measure capture the concept you care about?', 'Lab-style tests can miss real-world context (brand, habit, emotion). That is a question of ecological validity.']
  },
  {
    id: 'basics', title: 'The Focus Group', tag: 'Case file COKE-1985', guide: 'Focus groups',
    intro: `<p>Coca-Cola also ran <b>focus groups</b>: small group discussions about changing the formula. Here the picture was different. A minority of about 10 to 12% of participants were angry at the very idea of changing Coke, and some said they might stop drinking it. In group discussions, these participants put pressure on others.</p>`,
    task: `<p>Match each term to its description, then enter the four numbers <b>in the order of the terms</b>.</p>
    <div class="match">
      <div><div class="eyebrow">Terms</div><ol class="items" type="A"><li>Moderator</li><li>Discussion guide</li><li>Group dynamics</li><li>Typical group size</li></ol></div>
      <div><div class="eyebrow">Descriptions</div><ol class="items"><li>About 6 to 10 participants</li><li>The person who leads the discussion and makes sure everyone is heard</li><li>The way participants influence each other's opinions</li><li>The list of topics and questions prepared in advance</li></ol></div>
    </div>`,
    format: '4 digits, e.g. 1234', answer: ['2431'],
    hints: ['The moderator is a person, and the guide is a document.', 'The code starts with 2 and ends with 1.'],
    reveal: `<p>Focus groups are good at revealing <b>feelings, arguments and language</b> that a survey would miss, and the Coke focus groups did reveal the strong emotional attachment. But group dynamics cut both ways: they produce rich discussion, and they also let loud voices sway the rest.</p>`,
    debrief: ['A focus group is a moderated group discussion with about 6 to 10 people, guided by a discussion guide.', 'It reveals opinions, emotions and language, but group pressure can distort what individuals say.']
  },
  {
    id: 'transcript', title: 'The Loudest Voice', tag: 'Case file COKE-1985', guide: 'Group dynamics and the moderator',
    intro: `<p>Read this excerpt from a focus group in the style of the 1985 research.</p>
    <ol class="items notes">
      <li><b>Moderator:</b> What would you think if Coke had a new, smoother taste?</li>
      <li><b>P1:</b> If it tastes better, why not? I liked the new one in the test.</li>
      <li><b>P2:</b> Yeah, the new one was nice, actually. Sweeter.</li>
      <li><b>P4:</b> You can't just change Coke. It's like changing the American flag. I'd never buy it again.</li>
      <li><b>P1:</b> Well, it's just a drink…</li>
      <li><b>P4:</b> It's not "just a drink". My dad drank it, I drink it. They have no right.</li>
      <li><b>P2:</b> I guess… when you put it like that, I wouldn't want them to change it either.</li>
      <li><b>Moderator:</b> Thank you. Let's move on to packaging.</li>
    </ol>
    <p class="note">Illustrative transcript written for teaching. P3 was also present.</p>`,
    task: `<p>Enter two numbers: first the participant who <b>changed their opinion</b> under group pressure, then the participant who <b>never got to speak</b>.</p>`,
    format: '2 digits, e.g. 41', answer: ['23'],
    hints: ['Compare what P2 says in line 3 with what P2 says in line 7.', 'Count who speaks. Who is present but never appears in the transcript?'],
    reveal: `<p>A good moderator would have stopped at line 8 and asked: "P3, we haven't heard from you yet. What do you think?" and "P2, earlier you liked the new taste. Has your view changed?" Analysts must read focus groups for <b>who</b> said what and <b>why</b>, not just count opinions at the end.</p>`,
    debrief: ['Watch for dominant voices, conformity and silent participants.', 'The moderator\'s job is to bring in every voice and to follow up when opinions shift.']
  },
  {
    id: 'jam', title: 'The Jam Booth', tag: 'Case file JPSP-2000', guide: 'Field experiments and mixed methods',
    intro: `<p>Last case. In 2000, Sheena Iyengar and Mark Lepper published a field experiment that every marketing course quotes. In an upscale supermarket in California, a tasting booth offered either <b>24</b> or <b>6</b> kinds of jam, switching every few hours. Shoppers who stopped got a discount coupon.</p>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Booth</th><th>Shoppers passing</th><th>Stopped at the booth</th><th>Of those who stopped: bought jam</th></tr></thead>
      <tbody>
        <tr><td>24 jams</td><td>242</td><td>60%</td><td>3%</td></tr>
        <tr><td>6 jams</td><td>260</td><td>40%</td><td>30%</td></tr>
      </tbody>
    </table></div>
    <p>The authors called this <b>choice overload</b>: too much choice attracts people but stops them deciding.</p>`,
    task: `<p>Read the table. Out of every 100 shoppers who <b>stopped</b> at the 6-jam booth, how many bought jam?</p>`,
    format: 'a number, e.g. 12', answer: ['30', '30%'],
    hints: ['Use the last column, not the "stopped" column.', 'Find the 6-jam row.'],
    reveal: `<p>The big display attracted more people, but far fewer bought. Notice the design: changing the booth every few hours is a <b>field experiment</b> in a real shop, which gives it high ecological validity. But it was one shop, one product and a few hundred shoppers.</p>`,
    debrief: ['Field experiments test cause and effect in real settings, but one setting may not generalise.', 'Read percentages carefully: always ask "percent of what?"']
  },
  {
    id: 'final', title: 'The Final Verdict', tag: 'Board ruling', guide: 'A checklist for any study',
    intro: `<p>In 2010, Scheibehenne, Greifeneder and Todd combined the results of 50 experiments on choice overload in a <b>meta-analysis</b>. The average effect across all of them was <b>close to zero</b>. Some studies found choice overload, others found that more choice helped, and the result seemed to depend on the conditions. Nobody has found evidence of misconduct in the jam study.</p>`,
    task: `<p>This is the board's last ruling. What happens to the claim "too much choice makes customers buy less"?</p>
    <div class="opts">
      <div class="opt"><span class="tag">K</span><span>Keep it as a general law of marketing. The jam study was a real experiment.</span></div>
      <div class="opt"><span class="tag">C</span><span>Correct. Choice overload can happen under some conditions, but it is not a general rule.</span></div>
      <div class="opt"><span class="tag">R</span><span>Retract for fraud. The meta-analysis proves the data were invented.</span></div>
      <div class="opt"><span class="tag">X</span><span>Retract, because a single supermarket study can never tell us anything.</span></div>
    </div>`,
    format: '1 letter', answer: ['C'],
    hints: ['A meta-analysis combines many studies. A near-zero average with mixed results suggests the effect depends on conditions.', 'There is no sign of fabrication. Which ruling limits the claim without throwing the study away?'],
    reveal: `<p><b>The archive doors open.</b> Over four rooms the board has made four kinds of rulings: <b>retract</b> fabricated data (the honesty study), <b>correct</b> claims that did not replicate (power posing, the Hawthorne legend, choice overload), and <b>keep</b> robust findings with careful wording (the beauty premium). That is what reading research critically means: neither believing everything nor dismissing everything, but checking the evidence for each claim.</p>`,
    debrief: ['A meta-analysis combines many studies and is stronger evidence than any single study.', 'Six questions for any study: Who was studied? How was it measured? Experiment or correlation? How big is the effect? Has it been replicated? What else could explain it?']
  }],
  test: [
    { q: 'A focus group typically has…', o: ['1 participant', 'about 6 to 10 participants', 'about 100 participants', 'as many participants as possible'], a: 1 },
    { q: 'What is a focus group especially good at?', o: ['Estimating the exact share of customers who prefer a product', 'Revealing opinions, feelings and the language people use', 'Testing cause and effect', 'Replacing a representative survey'], a: 1 },
    { q: 'In a focus group, one confident participant convinces the others, who then all agree. This is a problem of…', o: ['sampling frame', 'group dynamics and conformity', 'regression', 'random error'], a: 1 },
    { q: 'What should a moderator do when one participant has said nothing?', o: ['Ignore them to save time', 'Invite them to share their view', 'End the session', 'Remove them from the transcript'], a: 1 },
    { q: 'New Coke won 200,000 blind taste tests but failed in the market. The best explanation is…', o: ['the sample was too small', 'the tests measured taste in a sip, not attachment to the brand', 'customers lied in the tests', 'focus groups are always wrong'], a: 1 },
    { q: 'Combining interviews with a survey to answer the same research question is called…', o: ['a meta-analysis', 'mixed methods', 'covert observation', 'a control group'], a: 1 },
    { q: 'A meta-analysis is…', o: ['a single very large study', 'a study that combines the results of many studies', 'a type of focus group', 'a regression with many controls'], a: 1 },
    { q: 'A well-known study is not fraudulent, but later research shows its effect only appears under certain conditions. The fairest ruling is…', o: ['keep it as a general rule', 'correct it by limiting the claim to those conditions', 'retract it for misconduct', 'ignore all later research'], a: 1 }
  ],
  guide: {
    minutes: 25,
    goals: ['Explain what focus groups are for and how they run', 'Recognise group dynamics in a transcript', 'Explain validity: does a measure capture what you want to know?', 'Read a field-experiment table and ask "percent of what?"', 'Use a six-question checklist to judge any study'],
    sections: [
    { h: 'Focus groups', html: `
      <p>A <b>focus group</b> is a moderated discussion with a small group, usually <b>6 to 10 people</b>, about a specific topic, lasting about 60 to 120 minutes. Companies use focus groups to explore how customers think and talk about products, adverts or brands.</p>
      <ul>
        <li><b>Moderator:</b> leads the discussion, keeps it on topic and makes sure everyone is heard.</li>
        <li><b>Discussion guide:</b> the list of topics and questions prepared in advance, from general to specific.</li>
        <li><b>Recruitment:</b> participants are usually chosen to share relevant characteristics (for example all regular buyers of a product), so they feel comfortable talking.</li>
        <li><b>Analysis:</b> the session is recorded and transcribed, then coded like interviews.</li>
      </ul>
      <p><b>Strengths:</b> participants react to each other, which brings out arguments, emotions and everyday language. It is fast and relatively cheap.</p>
      <p><b>Limits:</b> a handful of groups is not a representative sample, so focus groups cannot tell you what percentage of customers think something. And group dynamics can distort what individuals say.</p>` },
    { h: 'Group dynamics and the moderator', html: `
      <p>What people say in a group is not always what they think alone. Watch for:</p>
      <ul>
        <li><b>Dominant voices:</b> one or two confident people set the tone.</li>
        <li><b>Conformity:</b> people change their stated opinion to fit in with the group.</li>
        <li><b>Social desirability:</b> people say what sounds good ("I always buy organic") rather than what they do.</li>
        <li><b>Silent participants:</b> their views are missing from the data unless the moderator brings them in.</li>
      </ul>
      <p>A good moderator invites quiet participants by name, asks dominant speakers to let others respond, and follows up when someone changes their mind ("Earlier you said…, what changed?"). When you analyse a transcript, track <b>who</b> said what, and when opinions shifted.</p>` },
    { h: 'What does a measure really measure?', html: `
      <p><b>Validity</b> asks whether a study measures what it claims to measure. <b>Reliability</b> asks whether the measure gives consistent results. A bathroom scale that is always 3 kg off is reliable but not valid.</p>
      <ul>
        <li><b>Construct validity:</b> does the measure capture the concept? "Prefers the taste in a sip" is not the same as "will be happy if we replace the product".</li>
        <li><b>Ecological validity:</b> does the setting resemble real life? A blind sip test in a mall is very different from drinking a can from a red bottle with friends.</li>
        <li><b>External validity:</b> do the results apply to other people, places and times?</li>
      </ul>
      <p>A large sample does not fix a validity problem, just as it does not fix bias. You get a precise answer to the wrong question.</p>` },
    { h: 'Field experiments and mixed methods', html: `
      <p>A <b>field experiment</b> is an experiment in a real setting, such as a shop, a website or a workplace. The researcher still changes one thing (for example the number of products on display) and compares outcomes. Field experiments have high ecological validity, but researchers control less, and one setting may not generalise.</p>
      <p><b>Mixed methods</b> combine qualitative and quantitative approaches. A common pattern is: focus groups or interviews to discover <i>what</i> matters and <i>how</i> people talk about it, then a survey to measure <i>how many</i> people think so. Coca-Cola had both kinds of data in 1985. The focus groups showed the emotional attachment, but the decision followed the taste-test numbers.</p>
      <div class="example"><b>Reading percentages.</b> Always ask "percent of what?" In the jam study, 60% of <i>passing</i> shoppers stopped at the large display, but only 3% of <i>those who stopped</i> bought. Out of 100 passers-by, that is about 60 who stopped and 2 who bought. At the small display it is about 40 who stopped and 12 who bought.</div>` },
    { h: 'A checklist for any study', html: `
      <p>Before you believe a study, or a headline about one, ask six questions:</p>
      <ol>
        <li><b>Who was studied?</b> How were they selected, and who is missing? (Room 1)</li>
        <li><b>How was it measured?</b> Does the measure capture what the claim is about? (Room 4)</li>
        <li><b>Experiment or correlation?</b> Can the design show cause and effect, or only that things move together? (Room 2)</li>
        <li><b>How big is the effect?</b> Significant is not the same as important. (Room 2)</li>
        <li><b>Has it been replicated?</b> What do later and larger studies, or a meta-analysis, say? (Rooms 1, 2 and 4)</li>
        <li><b>What else could explain it?</b> Observer effects, group pressure, third variables, selection. (Rooms 2, 3 and 4)</li>
      </ol>
      <p>A <b>meta-analysis</b> statistically combines the results of many studies on the same question. It is usually the strongest evidence available, because one lucky or unlucky study cannot dominate it.</p>` }
    ],
    selfCheck: [
      { q: 'A brand wants to know what percentage of Austrians recognise its logo. Is a focus group the right method?', o: ['Yes, focus groups give exact percentages', 'No, a representative survey is needed for percentages', 'Yes, if the group has 10 people', 'No, only experiments can do that'], a: 1, why: 'Focus groups explore opinions and language, but they are not representative and cannot estimate percentages.' },
      { q: 'In a focus group, a participant says "I loved it" and then, after others criticise the product, says "Actually, it was okay". This is an example of…', o: ['reliability', 'conformity', 'random sampling', 'a meta-analysis'], a: 1, why: 'The participant adjusted their stated opinion to fit the group.' },
      { q: 'A hotel measures guest satisfaction only by counting complaints. What is the main concern?', o: ['Reliability', 'Construct validity: few complaints does not mean high satisfaction', 'Sample size', 'Covert observation'], a: 1, why: 'Many unhappy guests never complain, so the measure does not capture the concept well.' },
      { q: 'An online shop finds that 50% of visitors add an item to the basket, and 20% of those buy. Out of 1,000 visitors, how many buy?', o: ['500', '200', '100', '20'], a: 2, why: '50% of 1,000 is 500 baskets, and 20% of 500 is 100 purchases. Always ask "percent of what?"' },
      { q: 'Why is a meta-analysis usually stronger evidence than one study?', o: ['It always uses an experiment', 'It combines many studies, so one fluke cannot dominate', 'It has no limitations', 'It is always qualitative'], a: 1, why: 'Combining many results averages out the luck and the special conditions of single studies.' }
    ],
    sources: [
      { label: 'Wikipedia: New Coke (history, taste tests and focus groups)', url: 'https://en.wikipedia.org/wiki/New_Coke' },
      { label: 'Iyengar & Lepper (2000), Journal of Personality and Social Psychology: When choice is demotivating', url: 'https://doi.org/10.1037/0022-3514.79.6.995' },
      { label: 'Scheibehenne, Greifeneder & Todd (2010), Journal of Consumer Research: Can there ever be too many options?', url: 'https://doi.org/10.1086/651235' }
    ]
  }
}
]
};
