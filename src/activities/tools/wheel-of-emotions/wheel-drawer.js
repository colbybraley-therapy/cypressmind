/**
 * wheel-drawer.js – Cypress Mind
 * Live session drawer for the Wheel of Emotions activity.
 * Drop-in module, same pattern as live-session-drawer.js.
 *
 * Usage:
 *   <script src="../_shared/cypress-session-engine.js"></script>
 *   <script src="../tools/wheel-of-emotions/wheel-drawer.js"></script>
 *
 *   WheelDrawer.launch({
 *     client: 'J.M.',
 *     clientView: '../tools/wheel-of-emotions/index.html',
 *     // supabase: yourClient   // omit = same-browser BroadcastChannel
 *   });
 *
 *   WheelDrawer.onSave(function(summary) { /* save to Supabase *\/ });
 */
(function (global) {
  'use strict';

  /* ── DISCUSSION PROMPTS (word-keyed, 3 each) ── */
  const PROMPTS = {
    // JOY
    happy: [
      "What's making you feel happy right now?",
      "Where do you feel happy in your body?",
      "What do you want to do when you feel this happy?",
    ],
    cheerful: [
      "What's putting you in such a good mood?",
      "Who do you want to share this cheerful feeling with?",
      "Does this feeling come easily for you, or is it rare?",
    ],
    content: [
      "What does 'just right' feel like for you?",
      "Is there anything you'd want to change about this moment, or is it good as is?",
      "How long does this content feeling usually stick around for you?",
    ],
    warm: [
      "Who or what gives you this warm feeling?",
      "Can you remember the last time you felt this way?",
      "What does this warmth remind you of?",
    ],
    peaceful: [
      "What helped you get to this calm place?",
      "What does peaceful feel like in your body right now?",
      "Is this a feeling you get to have often?",
    ],
    thankful: [
      "What are you feeling thankful for today?",
      "Have you told that person or shared that thanks with anyone?",
      "What's something small you're grateful for that people might not expect?",
    ],
    relieved: [
      "What were you worried about that's now lifted?",
      "How does your body feel different now that the worry is gone?",
      "Was there a moment you knew you didn't have to worry anymore?",
    ],
    playful: [
      "What's making you want to be silly or have fun right now?",
      "What's your favorite way to be playful?",
      "Who do you like being playful with the most?",
    ],
    silly: [
      "What's the silliest thing that's happened to you lately?",
      "Do you let yourself be silly often, or does it feel rare?",
      "Who makes you feel safe enough to be silly?",
    ],
    proud: [
      "What did you do that you're proud of?",
      "Did anyone else notice, or is this just for you?",
      "What does pride feel like in your body?",
    ],
    grateful: [
      "What or who are you grateful for right now?",
      "Is this a feeling that comes easily, or do you have to look for it?",
      "How do you usually show someone you're grateful?",
    ],
    loved: [
      "Who makes you feel this way?",
      "How do you know when someone loves you?",
      "What does being loved feel like in your body?",
    ],
    energized: [
      "What's giving you all this energy?",
      "What do you want to do with it?",
      "Does this feeling come often, or is today different?",
    ],
    free: [
      "What does being free feel like for you right now?",
      "Was there something holding you back before this?",
      "What would you want to do with this free feeling?",
    ],
    hyper: [
      "What's got you feeling so wound up?",
      "What does your body want to do with all this energy?",
      "Does this feeling come on suddenly, or build up over time?",
    ],
    confident: [
      "What's making you feel so sure of yourself right now?",
      "Has this confidence always been there, or did you build it?",
      "What helps you feel this way when it's hard to find?",
    ],
    // TRUST
    safe: [
      "What makes this place or person feel safe to you?",
      "Has there been a time when you didn't feel safe? What was different?",
      "What helps you feel safe when things feel uncertain?",
    ],
    comfortable: [
      "What's making you feel at ease right now?",
      "Is this a new feeling here, or has it built up over time?",
      "What helps you relax when you're somewhere new?",
    ],
    open: [
      "What's making it feel okay to share right now?",
      "Is there something you've been wanting to talk about?",
      "Who else do you feel this open with?",
    ],
    accepted: [
      "Who or what makes you feel accepted just as you are?",
      "Has there been a time you didn't feel accepted? What was that like?",
      "What does it feel like in your body when you feel accepted?",
    ],
    included: [
      "What's happening that makes you feel part of things?",
      "Has there been a time you felt left out instead? What was different then?",
      "Who helps you feel included the most?",
    ],
    supported: [
      "Who's been there for you lately?",
      "What does support look like for you when you need it?",
      "Is it easy for you to ask for support, or does it feel hard?",
    ],
    understood: [
      "Who gets it when you try to explain how you feel?",
      "What does it feel like when someone really understands you?",
      "Has there been a time you felt misunderstood instead?",
    ],
    valued: [
      "What's making you feel like you matter right now?",
      "Who shows you that you're valued?",
      "What would it feel like if that went away?",
    ],
    close: [
      "Who do you feel this close to?",
      "What makes that connection feel real to you?",
      "How long did it take to feel this close with them?",
    ],
    seen: [
      "Who really sees you — not just what you do, but who you are?",
      "What does it feel like when someone notices the real you?",
      "Has there been a time you felt invisible instead?",
    ],
    respected: [
      "Who treats your thoughts and feelings like they matter?",
      "What does respect look like to you?",
      "Has there been a time you didn't feel respected?",
    ],
    belonging: [
      "Where do you feel like you truly belong?",
      "What made that place or group feel like yours?",
      "Has there been somewhere you wished you belonged but didn't?",
    ],
    calm: [
      "What helped you get to this settled place?",
      "What does calm feel like in your body?",
      "What usually pulls you out of feeling calm?",
    ],
    strong: [
      "What are you facing that's calling for this strength?",
      "Where does this strength come from for you?",
      "Has there been a time you didn't feel this strong? What changed?",
    ],
    friendly: [
      "Who are you feeling this warmth toward?",
      "What makes it easy to be open with them?",
      "Is this how you usually feel around new people, or does it take time?",
    ],
    resilient: [
      "What have you been through that you're still standing after?",
      "What's helped you keep going?",
      "What do you want people to know about how hard that was?",
    ],
    // FEAR
    uneasy: [
      "What's making things feel not quite right?",
      "Can you point to what's causing this, or is it hard to name?",
      "What helps when something feels off like this?",
    ],
    shy: [
      "What's making you want to hold back right now?",
      "Is this feeling familiar in certain situations?",
      "What helps you feel braver when shyness shows up?",
    ],
    nervous: [
      "What's coming up that's making you feel this way?",
      "Where do you feel nervous in your body?",
      "What usually helps settle your nerves?",
    ],
    worried: [
      "What's the thing you keep thinking about?",
      "What's the worst part you're imagining might happen?",
      "What would help you worry a little less right now?",
    ],
    anxious: [
      "What does this anxious feeling feel like in your body?",
      "Is there one thing causing it, or does it feel like a lot at once?",
      "What's helped you get through this feeling before?",
    ],
    tense: [
      "Where do you feel this tightness in your body?",
      "What's making you feel like you need to brace for something?",
      "What helps your body relax when it feels this tense?",
    ],
    alone: [
      "What's making you feel like no one's with you right now?",
      "Is there someone you wish was here?",
      "What would help you feel less alone in this?",
    ],
    unsafe: [
      "What's happening that makes this feel unsafe?",
      "What would need to change for this to feel safe again?",
      "Is there someone you can tell about this feeling?",
    ],
    scared: [
      "What's the thing that's scaring you?",
      "What does your body do when you feel scared?",
      "What helps you feel braver?",
    ],
    dread: [
      "What's the thing you think is coming that you're not looking forward to?",
      "How far away is it, and does that change how heavy this feels?",
      "Is there anything that would make it feel less heavy?",
    ],
    frozen: [
      "What's happening that's making it hard to move or think?",
      "What does frozen feel like for you?",
      "What's helped you get unstuck before?",
    ],
    panicked: [
      "What set this off?",
      "What does your body do when panic shows up?",
      "What's one thing that's helped slow it down before?",
    ],
    'on edge': [
      "What's making everything feel so alert right now?",
      "What is your body bracing for?",
      "What would help you feel like you could relax a little?",
    ],
    // SURPRISE
    curious: [
      "What's caught your attention?",
      "What do you want to know more about?",
      "Where do you think this curiosity might lead?",
    ],
    unsure: [
      "What's making this hard to figure out?",
      "What would help you feel more sure?",
      "Is there a part of this you do feel certain about?",
    ],
    confused: [
      "What's the part that's not making sense?",
      "What would help clear things up?",
      "Is this confusing feeling new, or has it been building?",
    ],
    startled: [
      "What caught you off guard?",
      "What did your body do in that moment?",
      "Did it take you long to feel okay again afterward?",
    ],
    amazed: [
      "What happened that's so hard to believe?",
      "Did you expect this, or did it come out of nowhere?",
      "Who do you want to tell about this?",
    ],
    disoriented: [
      "What shifted that's making things feel unclear?",
      "What would help you feel steady again?",
      "Is this a new feeling, or has something like this happened before?",
    ],
    shocked: [
      "What happened that hit you so hard?",
      "How long did it take to sink in?",
      "Who have you told about this, if anyone?",
    ],
    speechless: [
      "What happened that left you without words?",
      "If you could find the words, what would you want to say?",
      "Was this a good kind of speechless, or a hard kind?",
    ],
    surprised: [
      "What happened that you weren't expecting?",
      "How did your body react in that moment?",
      "Was it a good surprise or a hard one?",
    ],
    awe: [
      "What's the thing that's left you in awe?",
      "What does it feel like to witness something this big?",
      "Has anything ever made you feel this way before?",
    ],
    // SADNESS
    sad: [
      "What's making you feel this way?",
      "Where do you feel sadness in your body?",
      "What do you need most when you feel sad?",
    ],
    disappointed: [
      "What were you hoping would happen?",
      "What's it like realizing it didn't turn out that way?",
      "Has this happened before with this same thing?",
    ],
    lost: [
      "What's making things feel unclear right now?",
      "What would help you feel more grounded?",
      "Is this about a decision, a relationship, or something else?",
    ],
    lonely: [
      "What's making you feel disconnected from others right now?",
      "Is there someone you wish was closer to you?",
      "What helps when loneliness shows up?",
    ],
    hurt: [
      "What happened that left this hurt?",
      "Was it something someone said, or something they did?",
      "Have you been able to tell them how it felt?",
    ],
    excluded: [
      "What happened that made you feel left out?",
      "Was this on purpose, or do you think they didn't realize?",
      "What would have felt better in that moment?",
    ],
    homesick: [
      "What are you missing most right now?",
      "What does that place or person mean to you?",
      "Is there a way to feel a little closer to it from here?",
    ],
    forgotten: [
      "What happened that made you feel this way?",
      "Is this about one moment, or a pattern you've noticed?",
      "What would it look like for someone to remember you the way you want?",
    ],
    unwanted: [
      "What's making you feel this way?",
      "Has someone said or done something that brought this on?",
      "Who in your life makes you feel the opposite of this?",
    ],
    empty: [
      "What does this emptiness feel like for you?",
      "Is there usually something there that feels missing right now?",
      "What's one small thing that sometimes helps, even a little?",
    ],
    heartbroken: [
      "What happened that broke your heart?",
      "What's the hardest part to sit with right now?",
      "Is there anyone helping you carry this?",
    ],
    grief: [
      "What or who are you grieving?",
      "What's been the hardest moment so far?",
      "Is there a way you like to remember them?",
    ],
    invisible: [
      "What's making you feel like no one notices you?",
      "Has there been a time you felt the opposite — really seen?",
      "What would it look like for someone to notice you right now?",
    ],
    jealous: [
      "What does this other person have that you're wishing you had?",
      "Is this about a thing, attention, or a relationship?",
      "What would it feel like if you had that too?",
    ],
    // DISGUST
    uncomfortable: [
      "What's making this feel off to you?",
      "What would make this feel better?",
      "Is this a new feeling here, or has it built up?",
    ],
    bothered: [
      "What keeps getting under your skin?",
      "Have you said anything about it, or is it building up quietly?",
      "What would help this stop bothering you?",
    ],
    offended: [
      "What was said or done that didn't sit right?",
      "Do you think they realized how it landed?",
      "What would help you feel better about it?",
    ],
    repulsed: [
      "What's causing this strong reaction?",
      "Is this a new reaction, or does this always bother you?",
      "What would help you feel okay again?",
    ],
    disgusted: [
      "What happened that felt so wrong to you?",
      "Is this about something you saw, heard, or experienced?",
      "What do you wish was different about it?",
    ],
    // ANGER
    annoyed: [
      "What keeps bugging you?",
      "Is this a small thing building up, or one big thing?",
      "What would help take the edge off?",
    ],
    frustrated: [
      "What are you trying to do that keeps getting blocked?",
      "What's the hardest part about this for you?",
      "What would help you get unstuck?",
    ],
    mad: [
      "What happened that got you feeling this way?",
      "Where do you feel mad in your body?",
      "What do you wish was different right now?",
    ],
    ignored: [
      "What happened that made you feel unheard?",
      "Did you try to say something? What happened?",
      "What would it look like to actually be heard here?",
    ],
    disrespected: [
      "What happened that felt disrespectful?",
      "Do you think they meant it that way, or not?",
      "What would respect have looked like instead?",
    ],
    bitter: [
      "What happened that's still sitting with you?",
      "How long have you been carrying this?",
      "What would it take to let some of it go?",
    ],
    resentful: [
      "What's the unfair thing that never got fixed?",
      "Have you been able to say anything about it?",
      "What would feel like justice here?",
    ],
    betrayed: [
      "Who let you down, and how?",
      "What did you trust them with that got broken?",
      "Have you talked to them about how it felt?",
    ],
    furious: [
      "What happened that got you this angry?",
      "What does your body feel like right now?",
      "What usually helps you come down from this?",
    ],
    enraged: [
      "What pushed you to this point?",
      "What does it feel like trying to hold this in?",
      "What would help you feel safe to let some of it out?",
    ],
    angry: [
      "What happened that's making you feel this way?",
      "Where do you feel this anger in your body?",
      "What do you wish was different right now?",
    ],
    // ANTICIPATION
    ready: [
      "What are you getting ready for?",
      "What helped you feel prepared?",
      "What's left before you feel fully set?",
    ],
    waiting: [
      "What are you waiting for?",
      "How does the waiting feel — easy or hard?",
      "What helps you get through the wait?",
    ],
    hopeful: [
      "What's the good thing you're hoping might happen?",
      "What's making you believe it's possible?",
      "What would it mean to you if it actually happened?",
    ],
    eager: [
      "What are you looking forward to?",
      "What's making you so ready for it?",
      "How will you feel when it finally happens?",
    ],
    restless: [
      "What's making it hard to sit still?",
      "What are you waiting on?",
      "What would help you settle a little?",
    ],
    excited: [
      "What's coming up that's got you feeling this way?",
      "Who do you want to share this excitement with?",
      "What part are you looking forward to most?",
    ],
    impatient: [
      "What do you wish would just hurry up?",
      "What makes the waiting feel so hard right now?",
      "What would help make the wait easier?",
    ],
    dreading: [
      "What's the thing you're not looking forward to?",
      "What's the part that feels hardest about it?",
      "Is there anything that would make it feel more manageable?",
    ],
    // BODY & BEHAVIOR
    hungry: [
      "When did you last eat?",
      "Does it help to talk about this, or do you just need a snack first?",
      "Have you noticed it's harder to focus or feel calm when you're hungry?",
    ],
    sleepy: [
      "How did you sleep last night?",
      "What does your body feel like right now?",
      "Is there anything making it hard to get enough rest lately?",
    ],
    distracted: [
      "What keeps pulling your attention away?",
      "Is there something on your mind that's hard to put down right now?",
      "What would help you feel more focused?",
    ],
    disobedient: [
      "What rule or request are you pushing back on?",
      "What's making it feel important to push back right now?",
      "What would it look like to get your point across a different way?",
    ],
    secretive: [
      "Is there something you're not ready to share yet?",
      "What would help it feel safer to talk about, even a little?",
      "Is there a reason you're keeping this close right now?",
    ],
    focused: [
      "What are you locked in on right now?",
      "What helps you get into this kind of focus?",
      "What usually breaks your focus?",
    ],
    'worn out': [
      "What's been taking up so much of your energy lately?",
      "What would help you recharge?",
      "When's the last time you felt fully rested?",
    ],
    bored: [
      "What's making time feel like it's dragging?",
      "What would you rather be doing right now?",
      "Does this happen a lot, or is today different?",
    ],
    embarrassed: [
      "What happened that made you feel this way?",
      "Did anyone else notice, or does it feel bigger in your head?",
      "What would help you feel less embarrassed about it?",
    ],
    ashamed: [
      "What's making you feel bad about yourself right now?",
      "Is this about something you did, or something about who you are?",
      "What would it take to feel a little lighter about this?",
    ],
    guilt: [
      "What do you think you did wrong?",
      "Have you been able to talk to anyone about it?",
      "What would help make this right?",
    ],
    skeptical: [
      "What's making it hard to believe this?",
      "What would help convince you?",
      "Is this about trusting the situation, or trusting a person?",
    ],
    apathetic: [
      "What's making it hard to care about this right now?",
      "Has there been something that usually matters to you that doesn't right now?",
      "Is this a new feeling, or has it been building for a while?",
    ],
    overwhelmed: [
      "What's piling up right now?",
      "If you could put one thing down, what would it be?",
      "What would help even a little bit right now?",
    ],
  };


  /* ── WORD DEFINITIONS (per word) ── */
  const DEFINITIONS = {
    // JOY
    happy:      'Feeling good inside — like things are going the way you want them to.',
    cheerful:   'A bright, upbeat mood — you feel light and easy.',
    content:    'Not too much, not too little — things feel just right.',
    warm:       'A cozy, gentle feeling — like being wrapped in something comfortable.',
    peaceful:   'Calm and still inside — nothing feels rushed or wrong.',
    thankful:   'Noticing something good and feeling glad it is there.',
    relieved:   'The worry or pressure lifted — you can breathe again.',
    playful:    'In the mood to have fun, joke around, or be silly.',
    silly:      'Laughing at small things — light and goofy in a good way.',
    proud:      'Feeling good about something you did or who you are.',
    grateful:   'Aware of something kind or good someone did, and glad for it.',
    loved:      'Feeling like someone really cares about you — you matter to them.',
    energized:  'Full of energy and ready to go — everything feels possible.',
    free:       'No pressure, no rules holding you back — you can just be yourself.',
    hyper:      'So much energy it is hard to slow down or sit still.',
    confident:  'Trusting yourself to handle what is ahead.',
    // TRUST
    safe:        'You know you will not get hurt here — physically or emotionally.',
    comfortable: 'Relaxed and at ease — no need to be on guard.',
    open:        'Ready to share or listen — not holding back.',
    accepted:    'People are okay with you as you are — you do not have to change.',
    included:    'You are part of what is happening — not on the outside looking in.',
    supported:   'Someone is with you — you do not have to carry it alone.',
    understood:  'Someone gets what you mean and how you feel.',
    valued:      'People notice you and think you matter.',
    close:       'A real connection with someone — like there is a bond between you.',
    seen:        'Someone actually noticed you — not just what you do, but who you are.',
    respected:   'People treat your thoughts and feelings like they matter.',
    belonging:   'You feel like you are part of something and you fit there.',
    calm:        'Settled and steady — nothing feels like it is pulling at you.',
    strong:      'Capable of handling what is in front of you, inside and out.',
    friendly:    'Warm and open toward the people around you.',
    resilient:   'Able to bend without breaking — you keep going even when things are hard.',
    // FEAR
    uneasy:   'A mild, hard-to-name feeling that something is not quite right.',
    shy:      'Unsure around people — you want to pull back a little.',
    nervous:  'Jumpy or on edge, often before something uncertain.',
    worried:  'Thinking a lot about something that might go wrong.',
    anxious:  'A restless, swirling feeling about what might happen.',
    tense:    'Your body or mind is tight — like you are bracing for something.',
    alone:    'No one feels nearby — like you are going through it by yourself.',
    unsafe:   'Something feels like a threat — like you could get hurt.',
    scared:   'Danger feels real and close — you want to get away from it.',
    dread:    'A heavy feeling about something bad you think is coming.',
    frozen:   'So overwhelmed that you cannot move or think — stuck.',
    panicked: 'Fear that takes over fast — heart racing, hard to think straight.',
    'on edge': 'Jumpy and alert — like something could happen any second.',
    // SURPRISE
    curious:     'Something caught your interest and you want to know more.',
    unsure:      'You are not certain what to think or do yet.',
    confused:    'Things do not add up — you are trying to make sense of it.',
    startled:    'Something surprised you suddenly — like a jump, even a small one.',
    amazed:      'Something happened that is hard to believe — in a good way.',
    disoriented: 'Everything shifted and you are not sure where you stand.',
    shocked:     'Hit by something unexpected — takes a moment to absorb.',
    speechless:  'So surprised or moved that words will not come.',
    surprised:   'Something happened that you did not expect at all.',
    awe:         'A feeling so big it stops you in your tracks — wonder mixed with surprise.',
    // SADNESS
    sad:          'A heavy, down feeling — something hurts inside.',
    disappointed: 'You hoped for something, and it did not happen.',
    lost:         'Uncertain and disconnected — not sure what to do or where you fit.',
    lonely:       'Feeling separate from others — like no one really sees you.',
    hurt:         'Something someone said or did left a wound inside.',
    excluded:     'Left out on purpose — like you were not chosen.',
    homesick:     'Missing a place, a person, or a feeling of home.',
    forgotten:    'Like people did not remember you were there or that you matter.',
    unwanted:     'Feeling like no one really wants you around.',
    empty:        'Hollow inside — like feelings have gone quiet but not in a good way.',
    heartbroken:  'A sharp, painful sadness — like something inside you broke.',
    grief:        'Deep sadness after losing something or someone that mattered.',
    invisible:    'Like no one notices you are even there.',
    jealous:      'Wanting something someone else has — attention, a thing, or a relationship.',
    // DISGUST
    uncomfortable: 'Something feels off or wrong — you want to move away from it.',
    bothered:      'Something keeps getting on your nerves — it just does not sit right.',
    offended:      'Someone said or did something that felt disrespectful or wrong.',
    repulsed:      'A strong reaction — so turned off it almost feels physical.',
    disgusted:     'Really turned off by something — it feels deeply wrong.',
    // ANGER
    annoyed:      'Something small keeps bothering you — it is getting on your nerves.',
    frustrated:   'You are trying to get somewhere but something keeps blocking you.',
    mad:          'Something feels wrong or unfair and it fired you up.',
    ignored:      'You tried to be heard but nobody paid attention.',
    disrespected: 'Someone treated you like your feelings or opinions did not matter.',
    bitter:       'Anger mixed with hurt — something wounded you and you have not let go.',
    resentful:    'A slow-burning feeling about something unfair that was never fixed.',
    betrayed:     'Someone you trusted let you down in a way that really hurt.',
    furious:      'Very strong anger — hard to think straight through it.',
    enraged:      'Anger that has reached its peak — explosive and almost impossible to hold in.',
    angry:        'A strong feeling that something is wrong or unfair.',
    // ANTICIPATION
    ready:     'Prepared and set — whatever comes, you can meet it.',
    waiting:   'In between — something is coming and you are holding on until it does.',
    hopeful:   'Believing something good could still happen.',
    eager:     'Ready and excited — you really want this thing to happen.',
    restless:  'Too much energy to sit still — the waiting feels hard.',
    excited:   'Energized and happy about something coming or happening.',
    impatient: 'The waiting feels too long — you want it to happen now.',
    dreading:  'A heavy feeling about something you really do not want to face.',
    // BODY & BEHAVIOR
    hungry:      'Your body is asking for food — it can be hard to focus or feel calm without it.',
    sleepy:      'Your body needs rest — everything feels harder when you are tired.',
    distracted:  'Your attention keeps pulling away from what you are trying to focus on.',
    disobedient: 'Pushing back against rules or what someone asked you to do.',
    secretive:   'Holding something back — not ready or willing to share it yet.',
    focused:     'Locked in on one thing, with everything else fading into the background.',
    'worn out':  'Used up — physically or emotionally, like you have nothing left to give right now.',
    bored:       'Nothing feels interesting — like time is moving slowly and you want something to do.',
    embarrassed: 'Feeling exposed or silly in front of others — wishing you could disappear for a second.',
    ashamed:     'Feeling bad about who you are or something you did, deep down.',
    guilt:       'Feeling bad because you think you did something wrong.',
    skeptical:   'Not fully convinced — you want more proof before you believe it.',
    apathetic:   'Not really caring either way — hard to feel motivated about anything right now.',
    overwhelmed: 'Too much at once — feelings, tasks, or pressure beyond what you can hold.',
  };

  const FAMILY_COLORS = {
    joy:          '#F5C842',
    trust:        '#7DBF82',
    fear:         '#8A7FB5',
    surprise:     '#F4855A',
    sadness:      '#6A9CC7',
    disgust:      '#A3A84B',
    anger:        '#D95F6A',
    anticipation: '#E8A030',
    body:         '#8E9196',
  };

  const FAMILY_DARK = {
    joy:          '#9A7A10',
    trust:        '#2E6B33',
    fear:         '#3D2E7A',
    surprise:     '#8C3510',
    sadness:      '#1E4D7A',
    disgust:      '#4A4C10',
    anger:        '#7A1520',
    anticipation: '#7A4A00',
    body:         '#4A4D50',
  };

  /* ── STATE ── */
  var engine   = null;
  var sbClient  = null;   // Supabase client for session save
  var dbRowId   = null;   // wheel_sessions row id once inserted
  var opts     = {};
  var saveCb   = null;
  var built    = false;
  var connected = false;
  var startedAt = null;
  var ticking   = null;
  var sessionLog = [];   // array of { word, family, note, landed_at, discussed_at }
  var currentLanded = null; // { word, family, intensity }

  /* ── DOM REFS ── */
  var el = {};

  /* ── CSS (scoped to wd- prefix) ── */
  var CSS = `
    /* ── Root ── */
    .wd-root * { box-sizing: border-box; margin: 0; padding: 0; }
    .wd-root {
      --wd-bg:      #1C1F1E;
      --wd-panel:   #252928;
      --wd-card:    #2E332F;
      --wd-border:  rgba(255,255,255,0.07);
      --wd-text:    #E8EAE8;
      --wd-muted:   #8A9288;
      --wd-hunter:  var(--hunter, #355E3B);
      --wd-green:   #4a9c54;
      --wd-radius:  12px;
      font-family: var(--font-body, 'DM Sans', sans-serif);
    }

    /* ── Handle (tab on left edge) ── */
    .wd-handle {
      position: fixed;
      right: 0; top: 50%;
      transform: translateY(-50%);
      width: 36px;
      background: var(--wd-hunter);
      border-radius: 8px 0 0 8px;
      padding: 14px 6px;
      cursor: pointer;
      z-index: 9998;
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      box-shadow: -2px 0 12px rgba(0,0,0,0.3);
      transition: width 0.2s ease;
    }
    .wd-handle.wd-avail { display: flex; }
    .wd-handle-label {
      font-size: 10px;
      color: rgba(255,255,255,0.85);
      writing-mode: vertical-rl;
      text-orientation: mixed;
      letter-spacing: 0.08em;
      font-family: var(--font-head, 'Cinzel', serif);
    }
    .wd-handle-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
    }
    .wd-handle-dot.wd-live { background: #5CD85A; animation: wdPulse 1.6s ease-in-out infinite; }
    @keyframes wdPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

    /* ── Drawer panel ── */
    .wd-drawer {
      position: fixed;
      right: 0; top: 0; bottom: 0;
      width: 360px;
      background: var(--wd-bg);
      z-index: 9999;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
      display: flex;
      flex-direction: column;
      box-shadow: -4px 0 24px rgba(0,0,0,0.4);
      overflow: hidden;
    }
    .wd-drawer.wd-open { transform: translateX(0); }

    /* ── Header ── */
    .wd-header {
      background: var(--wd-hunter);
      padding: 16px 16px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .wd-header-left { display: flex; flex-direction: column; gap: 2px; }
    .wd-title {
      font-family: var(--font-head, 'Cinzel', serif);
      font-size: 13px;
      font-weight: 600;
      color: rgba(255,255,255,0.95);
      letter-spacing: 0.06em;
    }
    .wd-client-name {
      font-size: 11px;
      color: rgba(255,255,255,0.6);
    }
    .wd-header-right { display: flex; align-items: center; gap: 8px; }
    .wd-conn {
      display: flex; align-items: center; gap: 5px;
      font-size: 11px; color: rgba(255,255,255,0.55);
    }
    .wd-conn-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: rgba(255,255,255,0.25);
    }
    .wd-conn.wd-live .wd-conn-dot { background: #5CD85A; animation: wdPulse 1.6s ease-in-out infinite; }
    .wd-conn.wd-live .wd-conn-text { color: rgba(255,255,255,0.8); }
    .wd-close-btn {
      background: rgba(255,255,255,0.1);
      border: none; border-radius: 6px;
      width: 28px; height: 28px;
      cursor: pointer; color: rgba(255,255,255,0.7);
      font-size: 16px; line-height: 1;
      transition: background 0.15s;
      display: flex; align-items: center; justify-content: center;
    }
    .wd-close-btn:hover { background: rgba(255,255,255,0.18); }

    /* ── Status bar ── */
    .wd-status {
      background: var(--wd-panel);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--wd-border);
      flex-shrink: 0;
    }
    .wd-status-left { display: flex; flex-direction: column; gap: 2px; }
    .wd-status-label { font-size: 10px; color: var(--wd-muted); text-transform: uppercase; letter-spacing: 0.08em; }
    .wd-status-val { font-size: 13px; color: var(--wd-text); font-weight: 500; }
    .wd-elapsed { font-size: 20px; font-family: monospace; color: var(--wd-text); font-weight: 600; }

    /* ── Scroll body ── */
    .wd-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 14px 14px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .wd-body::-webkit-scrollbar { width: 4px; }
    .wd-body::-webkit-scrollbar-track { background: transparent; }
    .wd-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

    /* ── Waiting state ── */
    .wd-waiting {
      background: var(--wd-card);
      border: 1px solid var(--wd-border);
      border-radius: var(--wd-radius);
      padding: 20px 16px;
      text-align: center;
      color: var(--wd-muted);
      font-size: 13px;
      font-style: italic;
    }

    /* ── Landed card ── */
    .wd-landed {
      background: var(--wd-card);
      border-radius: var(--wd-radius);
      overflow: hidden;
      display: none;
    }
    .wd-landed.wd-show { display: block; }
    .wd-landed-top {
      padding: 14px 16px 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--wd-border);
    }
    .wd-landed-swatch {
      width: 40px; height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .wd-landed-info { flex: 1; }
    .wd-landed-word {
      font-family: var(--font-head, 'Cinzel', serif);
      font-size: 20px;
      font-weight: 600;
      line-height: 1.1;
    }
    .wd-landed-family {
      font-size: 11px;
      color: var(--wd-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 2px;
    }

    .wd-definition {
      font-size: 12px;
      color: var(--wd-muted);
      font-style: italic;
      line-height: 1.5;
      margin-top: 4px;
      padding: 6px 10px;
      background: rgba(255,255,255,0.04);
      border-radius: 6px;
      border-left: 2px solid rgba(255,255,255,0.1);
    }
    .wd-def-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255,255,255,0.2);
      margin-bottom: 2px;
      font-style: normal;
    }
    .wd-spins-left {
      font-size: 11px;
      color: var(--wd-muted);
      text-align: right;
      flex-shrink: 0;
    }
    .wd-spins-num {
      font-size: 18px;
      font-weight: 600;
      color: var(--wd-text);
      display: block;
      line-height: 1;
    }

    /* Prompts */
    .wd-prompts { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
    .wd-prompts-label {
      font-size: 10px;
      color: var(--wd-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 2px;
    }
    .wd-prompt {
      background: var(--wd-panel);
      border: 1px solid var(--wd-border);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      color: var(--wd-text);
      line-height: 1.5;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      position: relative;
    }
    .wd-prompt:hover { border-color: rgba(255,255,255,0.18); background: #333836; }
    .wd-prompt.wd-used {
      opacity: 0.4;
      text-decoration: line-through;
      cursor: default;
    }

    /* Note field */
    .wd-note-wrap { padding: 0 16px 14px; }
    .wd-note-label {
      font-size: 10px;
      color: var(--wd-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .wd-note {
      width: 100%;
      background: var(--wd-panel);
      border: 1px solid var(--wd-border);
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 13px;
      color: var(--wd-text);
      font-family: var(--font-body, 'DM Sans', sans-serif);
      resize: none;
      outline: none;
      transition: border-color 0.15s;
      line-height: 1.4;
    }
    .wd-note::placeholder { color: var(--wd-muted); }
    .wd-note:focus { border-color: rgba(255,255,255,0.25); }

    /* Mark discussed button */
    .wd-mark-wrap { padding: 0 16px 16px; }
    .wd-mark-btn {
      width: 100%;
      background: var(--wd-hunter);
      border: none; border-radius: 10px;
      padding: 13px 16px;
      font-family: var(--font-head, 'Cinzel', serif);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: rgba(255,255,255,0.95);
      cursor: pointer;
      transition: opacity 0.15s, transform 0.15s;
    }
    .wd-mark-btn:hover { opacity: 0.88; }
    .wd-mark-btn:active { transform: scale(0.98); }
    .wd-mark-btn:disabled { opacity: 0.35; cursor: default; }

    /* ── Session log ── */
    .wd-log-header {
      font-size: 10px;
      color: var(--wd-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 4px 2px;
    }
    .wd-log { display: flex; flex-direction: column; gap: 6px; }
    .wd-log-empty {
      font-size: 12px;
      color: var(--wd-muted);
      font-style: italic;
      padding: 4px 2px;
    }
    .wd-log-row {
      background: var(--wd-card);
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .wd-log-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .wd-log-word {
      font-size: 13px;
      font-family: var(--font-head, 'Cinzel', serif);
      font-weight: 600;
      flex: 1;
    }
    .wd-log-note {
      font-size: 11px;
      color: var(--wd-muted);
      font-style: italic;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ── Footer controls ── */
    .wd-footer {
      flex-shrink: 0;
      background: var(--wd-panel);
      border-top: 1px solid var(--wd-border);
      padding: 12px 14px;
      display: flex;
      gap: 8px;
    }
    .wd-foot-btn {
      flex: 1;
      background: var(--wd-card);
      border: 1px solid var(--wd-border);
      border-radius: 8px;
      padding: 9px 8px;
      font-size: 12px;
      color: var(--wd-text);
      cursor: pointer;
      transition: background 0.15s;
      font-family: var(--font-body, 'DM Sans', sans-serif);
    }
    .wd-foot-btn:hover { background: #333836; }
    .wd-foot-btn.wd-end {
      background: rgba(217,95,106,0.15);
      border-color: rgba(217,95,106,0.3);
      color: #D95F6A;
    }
    .wd-foot-btn.wd-end:hover { background: rgba(217,95,106,0.25); }

    /* ── Summary ── */
    .wd-summary {
      display: none;
      flex-direction: column;
      gap: 12px;
      padding: 14px;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
    .wd-summary.wd-show { display: flex; }
    .wd-summary-title {
      font-family: var(--font-head, 'Cinzel', serif);
      font-size: 15px;
      font-weight: 600;
      color: var(--wd-text);
    }
    .wd-summary-row {
      background: var(--wd-card);
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .wd-summary-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .wd-summary-word {
      font-family: var(--font-head, 'Cinzel', serif);
      font-size: 14px;
      font-weight: 600;
      flex: 1;
    }
    .wd-summary-meta { font-size: 11px; color: var(--wd-muted); }
    .wd-save-btn {
      background: var(--wd-hunter);
      border: none; border-radius: 10px;
      padding: 13px 16px;
      font-family: var(--font-head, 'Cinzel', serif);
      font-size: 13px; font-weight: 600; letter-spacing: 0.05em;
      color: rgba(255,255,255,0.95);
      cursor: pointer;
      transition: opacity 0.15s;
      width: 100%;
    }
    .wd-save-btn:hover { opacity: 0.88; }
  `;

  /* ── INJECT STYLES ── */
  function injectStyles() {
    if (document.getElementById('wd-styles')) return;
    var s = document.createElement('style');
    s.id = 'wd-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ── BUILD DOM ── */
  function ensureBuilt() {
    if (built) return;
    injectStyles();

    var root = document.createElement('div');
    root.className = 'wd-root';
    root.innerHTML = `
      <!-- Handle -->
      <div class="wd-handle" id="wd-handle" onclick="WheelDrawer.open()">
        <div class="wd-handle-dot" id="wd-handle-dot"></div>
        <div class="wd-handle-label">Session</div>
      </div>

      <!-- Drawer -->
      <div class="wd-drawer" id="wd-drawer">

        <!-- Header -->
        <div class="wd-header">
          <div class="wd-header-left">
            <div class="wd-title">Wheel of Emotions</div>
            <div class="wd-client-name" id="wd-client-name">Client</div>
          </div>
          <div class="wd-header-right">
            <div class="wd-conn" id="wd-conn">
              <div class="wd-conn-dot"></div>
              <span class="wd-conn-text" id="wd-conn-text">Waiting for client</span>
            </div>
            <button class="wd-close-btn" onclick="WheelDrawer.close()">×</button>
          </div>
        </div>

        <!-- Status bar -->
        <div class="wd-status">
          <div class="wd-status-left">
            <div class="wd-status-label">Emotions explored</div>
            <div class="wd-status-val" id="wd-explored">0</div>
          </div>
          <div class="wd-status-left" style="text-align:center">
            <div class="wd-status-label">Remaining</div>
            <div class="wd-status-val" id="wd-remaining">–</div>
          </div>
          <div>
            <div class="wd-elapsed" id="wd-elapsed">00:00</div>
          </div>
        </div>

        <!-- Scrollable body -->
        <div class="wd-body" id="wd-body">

          <!-- Landed card (hidden until spin lands) -->
          <div class="wd-landed" id="wd-landed">
            <div class="wd-landed-top">
              <div class="wd-landed-swatch" id="wd-landed-swatch"></div>
              <div class="wd-landed-info">
                <div class="wd-landed-word" id="wd-landed-word">–</div>
                <div class="wd-landed-family" id="wd-landed-family"></div>
                <div class="wd-definition" id="wd-definition"><div class="wd-def-label">Definition</div><span id="wd-def-text"></span></div>
              </div>
              <div class="wd-spins-left">
                <span class="wd-spins-num" id="wd-spins-num">–</span>
                left
              </div>
            </div>

            <!-- Prompts -->
            <div class="wd-prompts">
              <div class="wd-prompts-label">Discussion prompts</div>
              <div class="wd-prompt" id="wd-prompt-0" onclick="WheelDrawer.togglePrompt(0)"></div>
              <div class="wd-prompt" id="wd-prompt-1" onclick="WheelDrawer.togglePrompt(1)"></div>
              <div class="wd-prompt" id="wd-prompt-2" onclick="WheelDrawer.togglePrompt(2)"></div>
            </div>

            <!-- Optional note -->
            <div class="wd-note-wrap">
              <div class="wd-note-label">Quick note (optional)</div>
              <textarea class="wd-note" id="wd-note" rows="2" placeholder="e.g. mentioned school, strong reaction…"></textarea>
            </div>

            <!-- Mark discussed -->
            <div class="wd-mark-wrap">
              <button class="wd-mark-btn" id="wd-mark-btn" onclick="WheelDrawer.markDiscussed()">
                Mark as Discussed ✓
              </button>
            </div>
          </div>

          <!-- Waiting state (shown when no slice is landed) -->
          <div class="wd-waiting" id="wd-waiting">
            Waiting for the client to spin…
          </div>

          <!-- Session log -->
          <div class="wd-log-header">Explored this session</div>
          <div class="wd-log" id="wd-log">
            <div class="wd-log-empty" id="wd-log-empty">Nothing yet.</div>
          </div>
        </div>

        <!-- Summary (replaces body on close) -->
        <div class="wd-summary" id="wd-summary">
          <div class="wd-summary-title">Session Summary</div>
          <div id="wd-summary-rows"></div>
          <button class="wd-save-btn" id="wd-save-btn" onclick="WheelDrawer.save()">
            Save to Client Record
          </button>
        </div>

        <!-- Footer -->
        <div class="wd-footer">
          <button class="wd-foot-btn" onclick="WheelDrawer.nudge()">Send Nudge</button>
          <button class="wd-foot-btn wd-end" onclick="WheelDrawer.end()">Close Session</button>
        </div>

      </div>
    `;

    document.body.appendChild(root);

    // Cache refs
    el.handle     = document.getElementById('wd-handle');
    el.handleDot  = document.getElementById('wd-handle-dot');
    el.drawer     = document.getElementById('wd-drawer');
    el.clientName = document.getElementById('wd-client-name');
    el.conn       = document.getElementById('wd-conn');
    el.connText   = document.getElementById('wd-conn-text');
    el.elapsed    = document.getElementById('wd-elapsed');
    el.explored   = document.getElementById('wd-explored');
    el.remaining  = document.getElementById('wd-remaining');
    el.landed     = document.getElementById('wd-landed');
    el.landedSwatch = document.getElementById('wd-landed-swatch');
    el.landedWord   = document.getElementById('wd-landed-word');
    el.landedFamily = document.getElementById('wd-landed-family');
    el.definition   = document.getElementById('wd-definition');
    el.defText      = document.getElementById('wd-def-text');
    el.spinsNum   = document.getElementById('wd-spins-num');
    el.prompts    = [0,1,2].map(i => document.getElementById('wd-prompt-' + i));
    el.note       = document.getElementById('wd-note');
    el.markBtn    = document.getElementById('wd-mark-btn');
    el.waiting    = document.getElementById('wd-waiting');
    el.log        = document.getElementById('wd-log');
    el.logEmpty   = document.getElementById('wd-log-empty');
    el.body       = document.getElementById('wd-body');
    el.summary    = document.getElementById('wd-summary');
    el.summaryRows = document.getElementById('wd-summary-rows');
    el.saveBtn    = document.getElementById('wd-save-btn');

    built = true;
  }

  /* ── TIMER ── */
  function fmt(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function startTimer() {
    startedAt = Date.now();
    if (ticking) clearInterval(ticking);
    ticking = setInterval(function () {
      var secs = Math.floor((Date.now() - startedAt) / 1000);
      el.elapsed.textContent = fmt(secs);
    }, 1000);
  }

  /* ── CONNECTION ── */
  function setConnected() {
    connected = true;
    el.conn.classList.add('wd-live');
    el.connText.textContent = 'Client connected';
    el.handleDot.classList.add('wd-live');
    startTimer();
  }

  /* ── ENGINE EVENTS ── */
  function onEngineEvent(evt) {
    if (!evt) return;
    var d = evt.detail || {};

    if (evt.type === 'spin_landed') {
      showLanded({
        word:      d.word,
        family:    d.family,
        intensity: d.intensity,
        remaining: d.remaining,
        landed_at: d.landed_at,
      });
    }

    if (evt.type === 'pool_size') {
      el.remaining.textContent = d.total;
      if (sbClient && dbRowId && d.pool) {
        sbClient.from('wheel_sessions')
          .update({ word_pool: d.pool })
          .eq('id', dbRowId)
          .then(function(res) {
            if (res.error) console.warn('[WheelDrawer] pool save error:', res.error.message);
          });
      }
    }
  }

  /* ── LANDED STATE ── */
  function showLanded(data) {
    currentLanded = data;
    var color  = FAMILY_COLORS[data.family] || '#999';
    var dark   = FAMILY_DARK[data.family]   || '#333';
    var prompts = PROMPTS[data.word]       || [];

    el.landedSwatch.style.background = color + '33';
    el.landedSwatch.style.border     = '2px solid ' + color;
    el.landedSwatch.textContent       = getFamilySymbol(data.family);
    el.landedWord.textContent         = data.word;
    var defText = DEFINITIONS[data.word] || '';
    document.getElementById('wd-def-text').textContent = defText;
    document.getElementById('wd-definition').style.display = defText ? '' : 'none';
    el.landedWord.style.color         = color;
    el.landedFamily.textContent       = 'from ' + capitalize(data.family);
    el.spinsNum.textContent           = data.remaining !== undefined ? data.remaining : '–';

    // Populate prompts
    prompts.forEach(function (p, i) {
      el.prompts[i].textContent = p;
      el.prompts[i].classList.remove('wd-used');
    });

    el.note.value = '';
    el.markBtn.disabled = false;

    el.waiting.style.display = 'none';
    el.landed.classList.add('wd-show');
  }

  function hideLanded() {
    el.landed.classList.remove('wd-show');
    el.waiting.style.display = '';
    currentLanded = null;
  }

  /* ── MARK DISCUSSED ── */
  function markDiscussed() {
    if (!currentLanded) return;
    var note = el.note.value.trim();

    // Tell client screen to remove the slice
    if (engine) {
      engine.sendControl('mark_discussed', { word: currentLanded.word, note: note });
    }
    // Also call directly if same-tab demo — but not when a shared in-page
    // transport is in use: the control round-trip above already reaches
    // this page, and calling twice would log the spin twice.
    if (!opts.transport && global.markDiscussed) global.markDiscussed(note);

    // Log it
    var entry = {
      word:         currentLanded.word,
      family:       currentLanded.family,
      intensity:    currentLanded.intensity,
      note:         note,
      landed_at:    currentLanded.landed_at || new Date().toISOString(),
      discussed_at: new Date().toISOString(),
    };
    sessionLog.push(entry);
    addLogRow(entry);

    // Update counters
    el.explored.textContent = sessionLog.length;

    // Persist spin to Supabase
    if (sbClient && dbRowId) {
      sbClient.from('wheel_sessions')
        .update({
          spins:            sessionLog,
          emotions_visited: sessionLog.map(function(e) { return e.word; }),
        })
        .eq('id', dbRowId)
        .then(function(res) {
          if (res.error) console.warn('[WheelDrawer] spin update error:', res.error.message);
        });
    }

    hideLanded();
  }

  /* ── LOG ROW ── */
  function addLogRow(entry) {
    if (el.logEmpty) el.logEmpty.style.display = 'none';
    var color = FAMILY_COLORS[entry.family] || '#999';
    var row = document.createElement('div');
    row.className = 'wd-log-row';
    row.innerHTML =
      '<div class="wd-log-dot" style="background:' + color + '"></div>' +
      '<div class="wd-log-word" style="color:' + color + '">' + entry.word + '</div>' +
      (entry.note ? '<div class="wd-log-note">' + entry.note + '</div>' : '');
    el.log.appendChild(row);
  }

  /* ── TOGGLE PROMPT USED ── */
  function togglePrompt(i) {
    el.prompts[i].classList.toggle('wd-used');
  }

  /* ── NUDGE ── */
  function nudge() {
    if (engine) engine.sendControl('therapist_nudge', {});
  }

  var endCb = null;

  /* ── END SESSION ── */
  function end() {
    if (engine) engine.sendControl('end_session', {});
    if (ticking) { clearInterval(ticking); ticking = null; }
    if (endCb) endCb();
    showSummary();
  }

  /* ── SUMMARY ── */
  function showSummary() {
    el.body.style.display = 'none';
    el.summary.classList.add('wd-show');

    el.summaryRows.innerHTML = '';
    sessionLog.forEach(function (entry) {
      var color = FAMILY_COLORS[entry.family] || '#999';
      var row = document.createElement('div');
      row.className = 'wd-summary-row';
      row.style.marginBottom = '6px';
      row.innerHTML =
        '<div class="wd-summary-dot" style="background:' + color + '"></div>' +
        '<div class="wd-summary-word" style="color:' + color + '">' + entry.word + '</div>' +
        '<div class="wd-summary-meta">' + capitalize(entry.family) +
          (entry.note ? ' · ' + entry.note : '') + '</div>';
      el.summaryRows.appendChild(row);
    });

    if (sessionLog.length === 0) {
      el.summaryRows.innerHTML = '<div style="color:var(--wd-muted);font-size:13px;font-style:italic;padding:8px 0">No emotions were explored this session.</div>';
    }
  }

  /* ── SAVE ── */
  function save() {
    var secs = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    var summary = {
      client:            opts.client || null,
      spins:             sessionLog,
      emotions_visited:  sessionLog.map(function (e) { return e.word; }),
      session_duration_seconds: secs,
      closed_at:         new Date().toISOString(),
    };
    if (saveCb) saveCb(summary);

    // Final save to Supabase
    if (sbClient && dbRowId) {
      sbClient.from('wheel_sessions')
        .update({
          spins:                    sessionLog,
          emotions_visited:         sessionLog.map(function(e) { return e.word; }),
          session_duration_seconds: summary.session_duration_seconds,
          closed_at:                summary.closed_at,
        })
        .eq('id', dbRowId)
        .then(function(res) {
          if (res.error) {
            console.warn('[WheelDrawer] final save error:', res.error.message);
            el.saveBtn.textContent = 'Save failed – retry';
            el.saveBtn.disabled = false;
          } else {
            el.saveBtn.textContent = 'Saved ✓';
            el.saveBtn.disabled = true;
          }
        });
    } else {
      el.saveBtn.textContent = 'Saved ✓';
      el.saveBtn.disabled = true;
    }
  }

  /* ── OPEN / CLOSE ── */
  function open() {
    ensureBuilt();
    el.drawer.classList.add('wd-open');
  }

  function close() {
    el.drawer.classList.remove('wd-open');
  }

  /* ── LAUNCH ── */
  function launch(o) {
    ensureBuilt();
    opts = o || {};

    reset();
    el.clientName.textContent = opts.client || 'Client';
    // Single-device: the client holds the screen, so no visible "Session"
    // handle — the long-press TherapistOverlay handle reopens the drawer.
    if (!opts.singleDevice) el.handle.classList.add('wd-avail');

    // Capture Supabase client for DB save
    if (opts.supabase) sbClient = opts.supabase;

    // Wire engine if available
    var E = global.CypressSessionEngine;
    if (E) {
      if (engine) { try { engine.close(); } catch(err) {} engine = null; }
      var joinOpts = { role: 'therapist', code: opts.code || E.newCode() };
      if (opts.supabase) joinOpts.supabase = opts.supabase;
      if (opts.transport) joinOpts.transport = opts.transport;  // single-device LocalTransport
      engine = E.join(joinOpts);
      engine.onEvent(onEngineEvent);
      engine.onPresence(function () { if (!connected) setConnected(); });
      opts.code = joinOpts.code;
    }

    // Create the DB row immediately so we have an ID to update
    if (sbClient && opts.code) {
      var row = {
        session_code: opts.code,
        word_pool:    [],       // filled in once client starts
        spins:        [],
        started_at:   new Date().toISOString(),
        session_mode: opts.singleDevice ? 'single' : 'dual',
      };
      sbClient.from('wheel_sessions')
        .insert(row)
        .select('id')
        .single()
        .then(function(res) {
          if (res.data) { dbRowId = res.data.id; return; }
          // session_mode column may not be migrated yet (db/add-session-mode.sql) — retry without it
          if (res.error && /session_mode/.test(res.error.message || '')) {
            delete row.session_mode;
            sbClient.from('wheel_sessions').insert(row).select('id').single()
              .then(function(res2) { if (res2.data) dbRowId = res2.data.id; });
          }
          // Otherwise silently ignore RLS/table-missing errors — session data saves to session_responses instead
        });
    }

    // Open client view
    if (opts.clientView) {
      var sep = opts.clientView.indexOf('?') >= 0 ? '&' : '?';
      var url = opts.clientView + sep + 'session=' + encodeURIComponent(opts.code || 'demo') +
                (opts.supabase ? '&supabase=1' : '');
      window.open(url, '_blank');
    }

    open();
    return opts.code;
  }

  /* ── RESET ── */
  function reset() {
    connected = false;
    startedAt = null;
    sessionLog = [];
    currentLanded = null;
    dbRowId = null;
    if (ticking) { clearInterval(ticking); ticking = null; }

    if (!built) return;
    el.conn.classList.remove('wd-live');
    el.connText.textContent = 'Waiting for client';
    el.handleDot.classList.remove('wd-live');
    el.elapsed.textContent = '00:00';
    el.explored.textContent = '0';
    el.remaining.textContent = '–';
    el.log.innerHTML = '<div class="wd-log-empty" id="wd-log-empty">Nothing yet.</div>';
    el.logEmpty = document.getElementById('wd-log-empty');
    el.landed.classList.remove('wd-show');
    el.waiting.style.display = '';
    el.body.style.display = '';
    el.summary.classList.remove('wd-show');
    el.summaryRows.innerHTML = '';
    el.saveBtn.textContent = 'Save to Client Record';
    el.saveBtn.disabled = false;
  }

  /* ── HELPERS ── */
  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  function getFamilySymbol(family) {
    var symbols = {
      joy: '☀', trust: '🤝', fear: '🌀', surprise: '…',
      sadness: '🧊', disgust: '🌿', anger: '🔥', anticipation: '→',
      body: '🪽'
    };
    return symbols[family] || '●';
  }

  /* ── PUBLIC API ── */
  global.WheelDrawer = {
    launch:         launch,
    open:           open,
    close:          close,
    end:            end,
    save:           save,
    markDiscussed:  markDiscussed,
    nudge:          nudge,
    togglePrompt:   togglePrompt,
    onSave:         function (fn) { saveCb = fn; },
    onEnd:          function (fn) { endCb  = fn; },
    isLive:         function () { return connected; },
    code:           function () { return opts.code; },
    // Called by client screen when a slice lands (same-tab mode)
    notifyLanded:   function (data) { ensureBuilt(); showLanded(data); },
  };

})(typeof window !== 'undefined' ? window : global);
