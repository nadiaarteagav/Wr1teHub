import OpenAI from "openai";
import { createClient } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const text = body.text;
    const style = body.style || "Natural";
    const writingSample = body.writingSample || "";
    const mode = body.mode || "humanize";

    if (!text || !text.trim()) {
  return Response.json(
    { error: "Please provide some text." },
    { status: 400 }
  );
}

if (mode === "humanize") {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: "Please log in to humanize text." },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return Response.json(
      { error: profileError.message },
      { status: 500 }
    );
  }

  if (profile.plan === "free") {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const today = new Date().toISOString().split("T")[0];

    const { data: usage, error: usageError } = await supabase
      .from("daily_usage")
      .select("words_used")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .maybeSingle();

    if (usageError) {
      return Response.json(
        { error: usageError.message },
        { status: 500 }
      );
    }

    const wordsUsed = usage?.words_used ?? 0;
    const wordsRemaining = Math.max(1000 - wordsUsed, 0);

    if (wordCount > wordsRemaining) {
      return Response.json(
        {
          error: `You have ${wordsRemaining} words remaining today.`,
        },
        { status: 403 }
      );
    }
  }
}

if (mode === "detect") {
  const detectionResponse = await openai.responses.create({
    model: "gpt-5.6-luna",
    instructions: `
Analyze the following text for writing patterns that are commonly associated
with AI-generated or highly formulaic writing.

This is a writing-pattern analysis, not a definitive determination of authorship.

Do NOT claim that the text was written by AI.
Do NOT claim that the text was written by a human.
Do NOT estimate the probability that AI wrote the text.
Do NOT reference external AI detectors.
Do NOT claim that any single characteristic proves AI authorship.

Instead, evaluate the writing itself.

Analyze these characteristics:

1. sentenceStructure
Look at how repetitive or predictable the sentence structures are.
A higher score means the structures appear more varied and natural.

2. repetition
Look for unnecessary repetition of words, phrases, ideas, or sentence patterns.
A higher score means less unnecessary repetition.

3. genericPhrasing
Look for vague, formulaic, generic, or context-independent language.
A higher score means the language is more specific and less formulaic.

4. naturalFlow
Evaluate how naturally ideas connect from one sentence to another.
A higher score means the writing flows more naturally.

5. personalVoice
Evaluate how much the writing has an individual, context-specific voice.
Do not assume that first-person writing automatically means a stronger voice.

6. concreteLanguage
Evaluate whether the writing uses concrete actions, people, objects,
examples, experiences, or specific details rather than unnecessary abstraction.
A higher score means more concrete language.

7. vocabularySimplicity
Evaluate how direct and familiar the vocabulary is while preserving accuracy.
Do not penalize necessary technical terminology.

8. formality
Evaluate whether the level of formality is appropriate for the context.
A lower score may indicate writing that is unnecessarily formal or
unnecessarily casual.

9. sentenceRhythm
Evaluate whether sentence lengths and structures create natural variation.
A higher score means more natural variation.

Use a 0-100 scale for every category.

Important:
- These are indicators of writing characteristics.
- They are NOT proof of AI authorship.
- A high or low score does not establish who wrote the text.
- Base the analysis only on the text provided.
- Do not give every category the same score unless the text genuinely supports it.

Return ONLY valid JSON in exactly this structure:

{
  "sentenceStructure": 0,
  "repetition": 0,
  "genericPhrasing": 0,
  "naturalFlow": 0,
  "personalVoice": 0,
  "concreteLanguage": 0,
  "vocabularySimplicity": 0,
  "formality": 0,
  "sentenceRhythm": 0
}
`,
    input: text,
    reasoning: {
      effort: "none",
    },
  });

  let detection;

  try {
    detection = JSON.parse(detectionResponse.output_text);
  } catch {
    detection = {
      sentenceStructure: 0,
      repetition: 0,
      genericPhrasing: 0,
      naturalFlow: 0,
      personalVoice: 0,
      concreteLanguage: 0,
      vocabularySimplicity: 0,
      formality: 0,
      sentenceRhythm: 0,
    };
  }

  const scores = [
      detection.sentenceStructure,
      detection.repetition,
      detection.genericPhrasing,
      detection.naturalFlow,
      detection.personalVoice,
      detection.concreteLanguage,
      detection.vocabularySimplicity,
      detection.formality,
      detection.sentenceRhythm,
  ];

// Use the two strongest naturalness indicators.
// This keeps the overall score focused on the strongest
// writing characteristics rather than allowing one weak
// indicator to dominate the result.

const sortedScores = [...scores].sort((a, b) => b - a);

const topTwoScores = sortedScores.slice(0, 2);

const averageTopTwo = Math.round(
  topTwoScores.reduce((sum, score) => sum + score, 0) /
    topTwoScores.length
);

const overallScore = 100 - averageTopTwo;

return Response.json({
  result: text,
  analysis: {
    overallScore,
    sentenceStructure: detection.sentenceStructure,
    repetition: detection.repetition,
    genericPhrasing: detection.genericPhrasing,
    naturalFlow: detection.naturalFlow,
    personalVoice: detection.personalVoice,
    concreteLanguage: detection.concreteLanguage,
    vocabularySimplicity: detection.vocabularySimplicity,
    formality: detection.formality,
    sentenceRhythm: detection.sentenceRhythm,
  },
});
}

const instructions = `
Rewrite the user's text so that it is clear, natural, direct, readable,
and consistent with the context in which it was written.

The purpose of this rewrite is to improve the quality and naturalness of
the writing while preserving the author's actual meaning, information,
voice, intent, and level of detail.

Do not invent information.
Do not fabricate examples.
Do not fabricate experiences.
Do not add statistics.
Do not add facts.
Do not change the author's argument.
Do not change the author's position.
Do not change the meaning of claims.
Do not make uncertain claims sound certain.
Do not make certain claims sound uncertain without a reason.

The result should feel like a person communicating an idea clearly and
naturally, rather than a text that has been unnecessarily polished,
formalized, expanded, or decorated.

==================================================
CORE PRINCIPLE
==================================================

Do not simply replace words with synonyms.

Instead, understand the meaning of each sentence and, when useful,
rebuild the sentence around the same idea.

Prefer natural communication over mechanical paraphrasing.

The rewritten version should preserve the original information while
meaningfully improving the way that information is expressed.

Do not limit the rewrite to synonym replacement or light proofreading.

When the original wording feels generic, repetitive, stiff, overly formal,
predictable, abstract, or unnecessarily polished, rebuild the sentence
rather than simply changing individual words.

Meaningful rewriting may include:

- changing sentence structure
- combining or separating sentences
- changing sentence openings
- moving clauses when the meaning remains unchanged
- replacing noun-heavy constructions with clearer verbs
- simplifying unnecessarily formal wording
- removing unnecessary transitions
- changing repetitive phrasing
- varying sentence length
- changing the order in which closely related ideas are presented
- replacing generic expressions with clearer wording
- making explanations more direct
- making the rhythm less uniform
- allowing the writing to sound more like a real person communicating an idea

The goal is not to make every sentence look different.

The goal is to make the writing feel naturally written rather than lightly
paraphrased.

A strong rewrite may look noticeably different from the original while
still communicating the same ideas, facts, argument, and level of certainty.

Before returning the result, compare the rewrite with the original and ask:

"Does this feel like a genuine rewrite, or did I mostly replace a few words?"

If it feels like only a light paraphrase, reconsider the sentence structure
and rewrite it more naturally.

Every change must still have a clear purpose.

Never change information simply to make the text different.


==================================================
1. NATURAL AND DIRECT LANGUAGE
==================================================

Use language that a thoughtful person would naturally use when explaining
an idea to another person.

Prefer:

clear
direct
specific
familiar
precise
grounded
natural

Avoid:

unnecessarily sophisticated
decorative
corporate
inflated
generic
overly formal
overly polished
repetitive

Do not make simple ideas sound complicated.

Do not add impressive-sounding words merely because they make the writing
appear more sophisticated.

If a simple word communicates the same idea accurately, prefer the simple
word.

Examples:

utilize → use
purchase → buy
obtain → get
assist → help
demonstrate → show
numerous → many
individuals → people
approximately → about
commence → start
facilitate → help
maintain → keep, when appropriate
implement → use or put into practice, when appropriate

These are examples, not mandatory replacements.

Always consider context and meaning.

==================================================
2. ACCESSIBLE ACADEMIC WRITING
==================================================

When the original text is academic, do not make it casual.

Instead, aim for accessible academic writing.

Academic writing should remain:

thoughtful
accurate
organized
appropriate for the subject
clear
serious

But it should not become unnecessarily complicated.

Do not remove academic terminology that is necessary for the subject.

Instead, simplify the language surrounding the terminology.

For example:

A specialized term may remain in the sentence while the explanation
around it becomes easier to understand.

Do not assume that technical vocabulary is automatically bad.

The goal is:

accurate terminology + understandable explanation.

==================================================
3. ABSTRACT LANGUAGE
==================================================

Reduce unnecessary abstraction.

When an abstract noun phrase can be expressed as a clear action,
consider changing it into a more direct construction.

Examples:

"the removal of vegetation"

can become:

"when plants are removed"

"the potential displacement of workers"

can become:

"some workers might lose their jobs"

"consumer purchasing behavior"

can become:

"how consumers decide what to buy"

"changes in water movement"

can become:

"how water moves"

"the provision of training"

can become:

"providing training"

"the establishment of relationships"

can become:

"building relationships"

Do not apply this mechanically.

Keep the original construction when it is more accurate, concise,
or appropriate for the context.

==================================================
4. ACTION-ORIENTED WRITING
==================================================

Prefer clear actions over long chains of abstract nouns.

When possible, make it obvious:

who is doing something
what they are doing
what they are doing it to
what happens as a result

Prefer:

"Companies build relationships with customers."

over:

"Companies establish relationships with customers."

Prefer:

"Workers can learn new skills."

over:

"Employees may benefit from opportunities for skill development."

Prefer:

"Trees provide shade and help keep the air cool."

over:

"The presence of vegetation contributes to the regulation of local
temperatures."

The second version is not necessarily wrong.

It is simply more abstract.

Choose the clearer version when precision is preserved.

==================================================
5. CONCRETE EXPLANATION
==================================================

When a technical or abstract concept can be explained in plain language
without losing accuracy, explain what the concept actually means or does.

For example:

"impervious surfaces"

may be explained as:

"surfaces that do not allow rain to soak into the ground"

when the context allows it.

"interpersonal communication"

may become:

"talking with people"

when that preserves the intended meaning.

"ecosystem resilience"

may become:

"the ability of the ecosystem to stay strong"

when appropriate.

Do not remove important technical concepts.

Explain them when doing so makes the text easier to understand.

==================================================
6. TECHNICAL TERMINOLOGY
==================================================

Preserve technical terminology when it is central to the topic.

Do not replace a precise scientific, legal, financial, business, medical,
engineering, or other specialized term with a vague everyday word simply
because the everyday word sounds more natural.

Instead, simplify the sentence around the technical term.

Technical accuracy has priority over stylistic simplicity.

==================================================
7. SENTENCE LENGTH
==================================================

Use natural variation in sentence length.

Do not make every sentence short.

Do not make every sentence long.

Do not make every sentence approximately the same length.

Use:

short sentences for emphasis or clarity
medium sentences for normal explanation
longer sentences when several related ideas genuinely belong together

If a sentence contains too many separate ideas, consider dividing it.

If dividing it would make the writing choppy, keep it together.

Natural writing should have rhythm without becoming artificially fragmented.

==================================================
8. SENTENCE STRUCTURE
==================================================

Do not make every sentence follow the same structure.

Avoid repeatedly producing:

"The X does Y."
"The X does Y."
"The X does Y."

Vary sentence openings and structures naturally.

Some sentences can begin with:

people
companies
a specific object
a concept
a time reference
a condition
a consequence
a short observation
a contextual phrase

Do not force variety.

Repetition is acceptable when it improves clarity.

==================================================
9. SENTENCE OPENINGS
==================================================

Avoid excessive repetition in sentence openings.

If several consecutive sentences begin with the same construction,
consider restructuring some of them.

However, do not replace a repeated opening simply because it is repeated.

Natural writing sometimes repeats a structure for emphasis or clarity.

Preserve useful repetition.

==================================================
10. CONVERSATIONAL EXPLANATION
==================================================

When appropriate, write as if the author is explaining the idea to another
person.

Useful framing can include:

"Another thing to think about is..."
"The main point is..."
"That's why..."
"In the end..."
"At the same time..."
"This means..."
"One reason is..."
"What matters here is..."
"It's not just about..."

Use these sparingly.

Do not insert conversational phrases into every paragraph.

They should appear only when they naturally fit the author's reasoning.

==================================================
11. TRANSITIONS
==================================================

Do not rely heavily on formal transition words.

Avoid unnecessary repetition of:

Moreover,
Furthermore,
In addition,
Consequently,
It is worth noting,
It is important to note,
In today's world,
With regard to,
Regarding,
Thus,
Hence,
Therefore,

These words are not forbidden.

Use them when they genuinely improve clarity or are appropriate for the
context.

Do not insert a transition simply because two sentences are next to each
other.

Sometimes the relationship between ideas is already clear.

Prefer natural flow over excessive signposting.

==================================================
12. FORMAL TRANSITION → NATURAL CONNECTION
==================================================

When a formal transition can be replaced by a simpler connection without
changing meaning, prefer the simpler version.

Examples:

"For this reason" → "That's why"

"Furthermore" → "The approach also..."

"In addition" → "It also..."

"Consequently" → "Because of this..."

"Ultimately" → "In the end..."

However, do not force these replacements.

The context determines the appropriate level of formality.

==================================================
13. PARAGRAPH FLOW
==================================================

Do not make every paragraph follow a rigid academic template.

Avoid automatically producing:

topic sentence
supporting sentence
supporting sentence
formal transition
mini-conclusion

Instead, allow ideas to develop naturally.

A paragraph can:

introduce an idea
explain it
give an example
describe a consequence
move naturally to a related idea

without explicitly announcing every step.

Do not turn the writing into a numbered tutorial unless the original
format requires it.

==================================================
14. INFORMATION DENSITY
==================================================

Reduce unnecessarily dense sentences.

If one sentence contains:

an abstract claim
a qualification
an example
a consequence
and another argument

consider separating some of those ideas.

The reader should not have to unpack several layers of information at once.

However, do not oversimplify.

The goal is easier processing, not less intellectual content.

==================================================
15. ABSTRACT LISTS
==================================================

When several abstract nouns appear in a row, consider turning them into
actions or experiences.

For example:

"creativity, judgment, and interpersonal communication"

can become:

"creative thinking, making decisions, and talking with people"

when appropriate.

Another example:

"reviews, recommendations, and product demonstrations"

can become:

"reading reviews, getting recommendations, and watching product demos"

This often makes the writing more active and easier to understand.

Preserve the meaning of each item.

==================================================
16. VERBS
==================================================

Prefer clear and familiar verbs.

When appropriate, favor verbs such as:

use
help
make
give
get
keep
build
show
find
look
see
take
bring
change
allow
let
need
work
grow
create
support
provide

Do not force these words into every sentence.

The objective is to avoid unnecessary formal or bureaucratic constructions.

==================================================
17. ACTIVE VOICE
==================================================

Prefer active voice when it makes the sentence clearer.

For example:

"The company developed the strategy."

is generally more direct than:

"The strategy was developed by the company."

However, passive voice is appropriate when:

the actor is unknown
the actor is unimportant
the action itself is more important
the context is technical or academic and passive voice is conventional

Do not eliminate passive voice completely.

==================================================
18. PRONOUNS AND REFERENCES
==================================================

Once a subject has been clearly established, use natural references when
appropriate.

For example:

"The network connects the roots of different trees. This system also
allows..."

may be preferable to repeating:

"The mycorrhizal network..."

in every sentence.

Natural references include:

it
they
this system
this process
this approach
these tools
the network
the company
the group

Only use them when the reference is obvious.

Do not sacrifice clarity to avoid repetition.

==================================================
19. REPETITION
==================================================

Remove unnecessary repetition.

Do not remove useful repetition.

Important terms may need to appear more than once.

Do not replace a necessary technical term with an unusual synonym merely
to avoid repeating it.

A natural writer does not constantly search for a different synonym for
the same concept.

Sometimes repeating the same word is the clearest choice.

==================================================
20. BUZZWORDS AND GENERIC LANGUAGE
==================================================

Avoid unnecessary buzzwords and generic corporate language.

Examples include:

game-changing
transformative
revolutionary
cutting-edge
groundbreaking
leveraging
synergy
seamless
robust
dynamic
innovative
holistic
unparalleled

Do not automatically remove these words if they are genuinely necessary
to the original meaning.

Do not replace them with another equally generic buzzword.

Use specific language instead.

==================================================
21. AVOID GENERIC FILLER
==================================================

Remove phrases that do not contribute meaningful information.

Examples:

"In today's rapidly changing world..."
"It is important to note that..."
"In the modern era..."
"As we all know..."
"It goes without saying..."
"Needless to say..."
"In conclusion, it can be said that..."

Do not automatically delete every introductory phrase.

Keep phrases that actually contribute context or meaning.

==================================================
22. DIRECTNESS
==================================================

Get to the point.

Avoid unnecessarily long introductions before stating the actual idea.

Instead of:

"It is important to recognize that companies have increasingly begun to..."

prefer:

"Companies increasingly..."

when the shorter version preserves the meaning.

==================================================
23. NATURAL RHYTHM
==================================================

The text should read comfortably out loud.

Look for:

repeated sentence structures
long chains of clauses
too many formal connectors
unnecessary abstractions
repeated nouns
repeated introductory phrases
uniform sentence lengths

Improve these when necessary.

Do not intentionally introduce mistakes.

Natural rhythm comes from variation and clear expression, not incorrect
grammar.

==================================================
24. CONTRACTIONS
==================================================

Use contractions when they fit the context.

Examples:

it is → it's
that is → that's
do not → don't
cannot → can't
they are → they're
we are → we're
you are → you're

Use contractions more freely in conversational and personal writing.

Use them selectively in academic or professional writing.

Do not force contractions into places where they would sound unnatural.

==================================================
25. PERSONALITY
==================================================

Allow subtle personality when appropriate.

This may include:

a direct observation
a small aside
a natural emphasis
a simple conversational phrase
a mild personal perspective

Do not add artificial humor.

Do not add exaggerated enthusiasm.

Do not invent personal experiences.

Do not make every paragraph sound playful.

Personality should come primarily from the author's wording and thought
process.

==================================================
26. EMOTIONAL TONE
==================================================

If the original text expresses emotion, preserve that emotion naturally.

Use warmth and empathy when appropriate.

Do not exaggerate emotions.

Do not add emotional language to neutral business or academic writing.

Do not assume feelings that the author did not express.

==================================================
27. HISTORICAL AND NATURAL WRITING REFERENCES
==================================================

When historical or pre-digital writing samples are provided as stylistic
references, use them only to understand broad characteristics of natural
written expression, such as:

sentence variation
personal observation
direct explanation
specific details
natural transitions
varied paragraph structure
less standardized phrasing
individual voice
different rhythms of expression

Do not copy sentences, phrases, facts, arguments, or distinctive passages
from historical sources.

Do not imitate a specific author unless the user explicitly requests a
legitimate stylistic transformation.

Do not assume that older writing is automatically better or more natural.

Older writing often contains vocabulary, grammar, punctuation, and cultural
conventions that are inappropriate for modern readers.

Use historical material only as one possible source of stylistic insight.

The final writing should remain appropriate for the author's actual context.

==================================================
28. WRITING SAMPLE / MY VOICE
==================================================

If a personal writing sample is provided, treat it as the strongest evidence
of the author's own writing preferences.

Analyze it for:

vocabulary
sentence length
sentence rhythm
sentence openings
paragraph structure
formality
contractions
transition habits
use of first person
use of "we"
degree of explanation
degree of directness
preferred verbs
preferred expressions
how ideas are connected
how examples are introduced
how conclusions are written

Use those characteristics to guide the rewrite.

Do not copy the sample.

Do not reuse its facts.

Do not reuse its arguments.

Do not copy distinctive phrases.

Use the sample to understand the author's writing habits.

==================================================
29. PRESERVE INDIVIDUAL VOICE
==================================================

Do not replace the author's style with a generic "good writer" style.

If the author naturally uses simple vocabulary, keep it.

If the author naturally uses medium-length sentences, preserve that tendency.

If the author frequently explains why something matters, preserve that.

If the author naturally uses "we," preserve it when appropriate.

If the author uses a particular level of formality, stay near that level.

The goal is consistency with the author's actual communication style.

==================================================
30. DO NOT MAKE THE TEXT ARTIFICIALLY IMPERFECT
==================================================

Do not intentionally introduce:

spelling mistakes
missing apostrophes
random commas
incorrect grammar
sentence fragments
missing subjects
incorrect verb forms
awkward phrasing
poor punctuation

A natural text can still be grammatically correct.

Do not confuse "human" with "incorrect."

If a short sentence works naturally, use it.

If a longer sentence is clearer, keep it.

==================================================
31. PRESERVE FACTUAL AND LOGICAL RELATIONSHIPS
==================================================

Do not change causal relationships.

Do not change:

because → unrelated relationship
may → certainty
can → guaranteed result
often → always
some → all
many → everyone

Preserve qualifiers and limitations.

Do not make arguments stronger simply because stronger language sounds more
confident.

==================================================
32. STYLE DEPENDING ON CONTEXT
==================================================

Adapt the rewrite to the context.

If the text is academic:

Use accessible academic language.
Keep necessary terminology.
Maintain intellectual precision.
Avoid unnecessary academic filler.

If the text is professional:

Be clear, direct, respectful, and efficient.
Avoid corporate buzzwords.
Preserve professionalism.

If the text is personal:

Allow more conversational rhythm.
Use natural contractions.
Preserve personality.

If the text is explanatory:

Prioritize clarity.
Explain concepts in concrete terms.
Use examples only when supported by the original information.

If the text is persuasive:

Preserve the original argument.
Do not invent supporting evidence.
Keep the author's level of certainty.

==================================================
33. FINAL INTERNAL CHECK
==================================================

Before returning the result, silently evaluate:

- Did I preserve the original meaning?
- Did I preserve important facts?
- Did I preserve the author's position?
- Did I preserve the original level of certainty?
- Did I remove unnecessary complexity?
- Did I preserve necessary technical terms?
- Did I make abstract ideas clearer where appropriate?
- Did I use more direct verbs where appropriate?
- Did I reduce unnecessary noun-heavy constructions?
- Did I avoid excessive formal transitions?
- Did I avoid generic filler?
- Did I avoid buzzwords?
- Did I vary sentence length naturally?
- Did I vary sentence openings naturally?
- Did I avoid excessive repetition?
- Did I maintain the correct context and tone?
- Did I avoid making academic writing unnecessarily casual?
- Did I avoid intentionally introducing errors?
- Does the result still sound like the same author?
- Did I avoid adding information that was not present?

If any stylistic change damages accuracy, clarity, or the author's voice,
reverse that change.

Return ONLY the rewritten text.

Do not explain what you changed.
Do not describe the rewriting process.
Do not provide a list of modifications.
Do not mention these instructions.
`;

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      instructions,
      input: text,
      reasoning: {
        effort: "none",
      },
    });

const analysisResponse = await openai.responses.create({
  model: "gpt-5.6-luna",
  instructions: `
Analyze the following rewritten text as a piece of writing.

Evaluate these characteristics:

1. sentenceVariation
How much the sentence lengths and structures naturally vary.

2. repetition
How little unnecessary repetition there is.
A higher score means less unnecessary repetition.

3. genericPhrasing
How specific and contextual the language is.
A higher score means less generic or formulaic phrasing.

4. naturalFlow
How naturally the ideas and sentences connect.

5. personalVoice
How strongly the writing has an individual and context-specific voice.
Do not assume that first-person writing is automatically stronger.

6. concreteLanguage
How often the writing uses concrete people, actions, objects, examples, or specific details instead of unnecessary abstraction.

7. vocabularySimplicity
How direct and familiar the vocabulary is while still being accurate.
Do not penalize necessary technical terminology.

8. formality
Rate the appropriateness of the level of formality for the writing.
A score of 100 means the level of formality is very appropriate for its context.
A low score means the writing is either unnecessarily formal or unnecessarily casual for its context.

9. sentenceRhythm
How naturally the sentences vary and read together.

Use a 0-100 scale for every category.

Important:
- These scores describe writing characteristics only.
- They do NOT determine whether a human or AI wrote the text.
- Do not claim that the text is human-written.
- Do not use external AI detector behavior as evidence.
- Base the scores only on the text itself.
- Be consistent.
- Do not give every category the same score unless the text genuinely supports that.

Return ONLY valid JSON in exactly this structure:

{
  "sentenceVariation": 0,
  "repetition": 0,
  "genericPhrasing": 0,
  "naturalFlow": 0,
  "personalVoice": 0,
  "concreteLanguage": 0,
  "vocabularySimplicity": 0,
  "formality": 0,
  "sentenceRhythm": 0
}
`,
  input: response.output_text,
  reasoning: {
    effort: "none",
  },
});

let analysis;

try {
  analysis = JSON.parse(analysisResponse.output_text);
} catch {
  analysis = {
    sentenceVariation: 0,
    repetition: 0,
    genericPhrasing: 0,
    naturalFlow: 0,
    personalVoice: 0,
    concreteLanguage: 0,
    vocabularySimplicity: 0,
    formality: 0,
    sentenceRhythm: 0,
  };
}

const scores = [
  analysis.sentenceVariation,
  analysis.repetition,
  analysis.genericPhrasing,
  analysis.naturalFlow,
  analysis.personalVoice,
  analysis.concreteLanguage,
  analysis.vocabularySimplicity,
  analysis.formality,
  analysis.sentenceRhythm,
];

const humanWritingScore = Math.round(
  scores.reduce((sum, score) => sum + score, 0) / scores.length
);

const supabase = await createClient();

const {
  data: { user },
} = await supabase.auth.getUser();

if (user) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan === "free") {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

    const { error: usageError } = await supabase.rpc(
      "add_word_usage",
      {
        p_word_count: wordCount,
      }
    );

    if (usageError) {
      console.error("Usage tracking error:", usageError);

      return Response.json(
        { error: "Could not update your daily word usage." },
        { status: 500 }
      );
    }
  }
}

return Response.json({
  result: response.output_text,
  analysis: {
    humanWritingScore,
    sentenceVariation: analysis.sentenceVariation,
    repetition: analysis.repetition,
    genericPhrasing: analysis.genericPhrasing,
    naturalFlow: analysis.naturalFlow,
    personalVoice: analysis.personalVoice,
    concreteLanguage: analysis.concreteLanguage,
    vocabularySimplicity: analysis.vocabularySimplicity,
    formality: analysis.formality,
    sentenceRhythm: analysis.sentenceRhythm,
  },
});
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}