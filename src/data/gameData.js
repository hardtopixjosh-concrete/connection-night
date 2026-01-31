import { Smile, MessageCircle, Heart, Users, Sparkles, Zap, Calendar, Moon, Shield, Gift, Coffee, Utensils, Flame, Battery, Sun } from 'lucide-react';

export const INTENSITY_ORDER = { low: 1, medium: 2, high: 3 };

// --- LIVE SIGNALS (MOODS) ---
// Only the ones you requested
export const MOOD_SIGNALS = [
  { id: 'horny', label: 'Horny', color: 'bg-rose-600', icon: Flame },
  { id: 'talkative', label: 'Talkative', color: 'bg-indigo-500', icon: MessageCircle },
  { id: 'cuddly', label: 'Need Affection', color: 'bg-pink-500', icon: Heart },
];

// --- LOVE LANGUAGE ACTIONS (For Daily Drop) ---
export const MICRO_CONNECTIONS = [
  { id: 'compliments', label: 'Sincere Compliments', color: 'bg-blue-500', icon: Smile },
  { id: 'conversations', label: 'Conversations', color: 'bg-indigo-500', icon: MessageCircle },
  { id: 'hugs', label: '10+ Second Hugs', color: 'bg-rose-500', icon: Heart },
  { id: 'sitting_close', label: 'Sitting Close', color: 'bg-violet-500', icon: Users },
  { id: 'public_affection', label: 'Public Affection', color: 'bg-fuchsia-500', icon: Sparkles },
  { id: 'massages', label: 'Micro Massages', color: 'bg-emerald-500', icon: Zap },
  { id: 'activities', label: 'Activities Together', color: 'bg-amber-500', icon: Calendar },
  { id: 'cuddling', label: 'Cuddling', color: 'bg-pink-500', icon: Moon },
  { id: 'acts', label: 'Acts of Service', color: 'bg-cyan-500', icon: Shield },
  { id: 'gifts', label: 'Gifts', color: 'bg-orange-500', icon: Gift },
  { id: 'flowers', label: 'Flowers', color: 'bg-lime-500', icon: Heart },
  { id: 'chores', label: 'Chores at Home', color: 'bg-slate-500', icon: Coffee },
];

export const DAILY_QUESTS = {
  compliments: [
    "Comment on a specific skill they used today that impressed you.",
    "Tell them exactly why you love having them as a partner.",
    "Compliment their appearance in a specific detail (eyes, hair, style).",
    "Thank them for a tiny thing they do that usually goes unnoticed.",
    "Text them a compliment right now so they see it when they check their phone."
  ],
  conversations: [
    "Ask: 'What is one thing you're looking forward to this month?' and just listen.",
    "Ask: 'If we could travel anywhere right now, where would we go?'",
    "Ask: 'What was the most stressful part of your day, and how can I help?'",
    "Share a favorite memory of the two of you and ask for their perspective on it.",
    "Ask: 'What is a hobby you've always wanted to try but haven't yet?'"
  ],
  hugs: [
    "Initiate a hug that lasts at least 10 seconds. Don't let go first.",
    "Hug them from behind while they are doing something (cooking/standing).",
    "Give them a 'welcome home' hug that lifts them off their feet slightly.",
    "Pull them in for a tight squeeze when you walk past them.",
    "Hug them immediately after this sentence finishes."
  ],
  sitting_close: [
    "Close the physical gap so your shoulders touch while relaxing tonight.",
    "Sit on the same side of the booth/table if you go out (or eat at home).",
    "Put your legs over theirs while on the couch.",
    "Rest your head on their shoulder for 5 minutes.",
    "Sit on the floor together while doing a usually solitary activity."
  ],
  public_affection: [
    "Reach for their hand or put an arm around them while you're out today.",
    "Give them a quick kiss on the cheek in public (grocery store, park).",
    "Place your hand on their lower back while walking through a door.",
    "Hold hands while driving (or riding) in the car.",
    "Wink at them across the room if you are with friends."
  ],
  massages: [
    "Give them a 2-minute shoulder or neck rub without them asking.",
    "Offer a quick foot rub while watching TV.",
    "Run your fingers through their hair for a few minutes.",
    "Squeeze their hands/palms to release tension.",
    "Trace light circles on their back while relaxing."
  ],
  activities: [
    "Suggest a 15-minute walk around the block, just the two of you.",
    "Play a quick card game or board game round.",
    "Cook a meal together (one chops, one stirs).",
    "Do a 10-minute stretch or yoga video together.",
    "Listen to one song together and just focus on the music."
  ],
  cuddling: [
    "Spend 10 minutes focused solely on skin-to-skin closeness.",
    "Big spoon / Little spoon time before falling asleep.",
    "Lay your head in their lap while they watch TV/read.",
    "Morning cuddle: Stay in bed for 5 extra minutes holding each other.",
    "Nap together (or just rest eyes) for 20 minutes."
  ],
  acts: [
    "Identify one small friction point in their day and handle it silently.",
    "Fill up their water bottle or make their coffee without asking.",
    "Take out the trash or do the dishes before they notice.",
    "Warm up their towel (or car) for them.",
    "Handle a task they've been dreading making a call for."
  ],
  gifts: [
    "Pick up a tiny 'just because' treat like their favorite snack.",
    "Write a post-it note with a drawing and hide it in their bag.",
    "Buy them a digital item (game skin, book, song) they want.",
    "Bring home their favorite drink on your way back.",
    "Print out a photo of the two of you and frame/stick it somewhere."
  ],
  flowers: [
    "Surprise them with a single flower to brighten their desk or bedside.",
    "Pick a wildflower (if legal/available) on a walk.",
    "Buy a small succulent or plant instead of cut flowers.",
    "Make a paper flower or origami heart.",
    "Bring a bouquet for 'no reason' other than it's Tuesday."
  ],
  chores: [
    "Complete one household task that is usually 'theirs' before they get to it.",
    "Do a deep clean of one specific thing (microwave, sink, toilet).",
    "Fold the laundry that has been sitting in the basket.",
    "Make the bed perfectly so it feels like a hotel.",
    "Clear the clutter off a surface they use often."
  ]
};

export const STORE_ITEMS = [
  { id: 'dinner_pick', label: 'Pick Home Dinner Idea', cost: 1, icon: Utensils, desc: 'Total authority on what we eat at home tonight.' },
  { id: 'chore', label: 'Chore at Home', cost: 3, icon: Coffee, desc: 'Partner handles a chore of your choice.' },
  { id: 'movie', label: 'Movie Night Pick', cost: 3, icon: Sparkles, desc: 'You choose the movie, no complaints.' },
  { id: 'gift', label: 'Surprise Gift', cost: 5, icon: Gift, desc: 'A small thoughtful gift within 48 hours.' },
  { id: 'massage', label: 'Full Massage', cost: 8, icon: Zap, desc: 'A dedicated 20-minute relaxation session.' },
  { id: 'night_alone', label: 'Night Alone', cost: 10, icon: Moon, desc: 'Full guilt-free evening to yourself.' },
  { id: 'fancy_dinner', label: 'Fancy Dinner Out', cost: 15, icon: Utensils, desc: 'A reservation at a restaurant of your choice.' },
];

// --- YOUR ORIGINAL DECK ---
export const FULL_DECK = [
  // LOW INTENSITY
  { id: 'l1', title: "Cuddling + conversation", intensity: 'low', category: 'Intimacy', desc: "Close contact with meaningful talk." },
  { id: 'l2', title: "Massage exchange", intensity: 'low', category: 'Touch', desc: "Relaxing touch for both partners." },
  { id: 'l3', title: "Shower together", intensity: 'low', category: 'Intimacy', desc: "Washing each other, non-sexual focus." },
  { id: 'l4', title: "Laying together listening to music while cuddling", intensity: 'low', category: 'Relax', desc: "Shared listening experience." },
  { id: 'l5', title: "Whisper conversation in bed with lights off", intensity: 'low', category: 'Intimacy', desc: "Quiet connection in the dark." },
  { id: 'l6', title: "Say 2-3 appreciated or attractive things while cuddling", intensity: 'low', category: 'Affirmation', desc: "Vocalizing appreciation." },
  { id: 'l7', title: "Night out with dinner/activity", intensity: 'low', category: 'Date', desc: "Time spent out of the house." },
  { id: 'l8', title: "Puzzle sitting next to each other with food", intensity: 'low', category: 'Activity', desc: "Shared goal with snacks." },

  // MEDIUM INTENSITY
  { id: 'm1', title: "Making out", intensity: 'medium', category: 'Passion', desc: "Focus on kissing." },
  { id: 'm2', title: "Mutual touching with clothes on", intensity: 'medium', category: 'Touch', desc: "Exploration over clothing." },
  { id: 'm3', title: "Naked cuddling", intensity: 'medium', category: 'Intimacy', desc: "Skin-to-skin closeness." },
  { id: 'm4', title: "Clothes on grinding", intensity: 'medium', category: 'Passion', desc: "Friction and pressure." },
  { id: 'm5', title: "Blindfolded kissing and touch (non sexual zones)", intensity: 'medium', category: 'Sensory', desc: "Heightened sensation play." },
  { id: 'm6', title: "Lap sitting with kissing", intensity: 'medium', category: 'Passion', desc: "Physical closeness and kissing." },
  { id: 'm7', title: "Watch or listen to romance/erotic scene", intensity: 'medium', category: 'Sensory', desc: "Shared visual/audio stimulation." },
  { id: 'm8', title: "Strip game/poker/activity", intensity: 'medium', category: 'Fun', desc: "Playful removal of clothing." },

  // HIGH INTENSITY
  { id: 'h1', title: "Sex connection", intensity: 'high', category: 'Physical', desc: "Full intercourse connection." },
  { id: 'h2', title: "Oral connection only", intensity: 'high', category: 'Pleasure', desc: "Focus on oral stimulation." },
  { id: 'h3', title: "Oral-led to lead to other things", intensity: 'high', category: 'Flow', desc: "Starting with oral, moving forward." },
  { id: 'h4', title: "Slow immersive session", intensity: 'high', category: 'Passion', desc: "Taking time, focusing on sensation." },
  { id: 'h5', title: "Agreed-upon themed scenario", intensity: 'high', category: 'Roleplay', desc: "Acting out a specific fantasy." },
  { id: 'h6', title: "New position or environment", intensity: 'high', category: 'Explore', desc: "Trying something or somewhere new." },
  { id: 'h7', title: "Explore a new dynamic or curiosity together", intensity: 'high', category: 'Explore', desc: "Testing a new boundary or idea." },
  { id: 'h8', title: "Select intimacy tokens for later", intensity: 'high', category: 'Planning', desc: "Choosing specific acts for future." },
  { id: 'h9', title: "Roll intimacy dice", intensity: 'high', category: 'Chance', desc: "Letting the dice decide." },
  { id: 'h10', title: "BDSM Bed cuffs", intensity: 'high', category: 'Kink', desc: "Using restraints." }
];