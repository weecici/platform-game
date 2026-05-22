export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface GameQuestState {
  collectedSet: Set<string>;
  getLabel: (id: string) => string;
  npcTalkStates: { [npcId: string]: boolean };
  npcCompleteStates: { [npcId: string]: boolean };
  teleport: (x: number, y: number, z: number) => void;
  grantBlock?: (blockId: string, count?: number) => void;
}

export interface NpcConfig {
  id: string;
  name: string;
  modelPath: string;
  position: [number, number, number];
  interactionRadius: number;
  requiredItems?: string[];
  getDialogue: (state: GameQuestState) => DialogueLine[];
  onComplete?: (state: GameQuestState) => void;
}

export interface StoryConfig {
  npcs: NpcConfig[];
  ufoPosition: [number, number, number];
  teleportTarget: [number, number, number];
}

export const STORY_CONFIG: StoryConfig = {
  ufoPosition: [-13, 47, 209],
  teleportTarget: [75, 275, -90],
  npcs: [
    {
      id: "building_owner",
      name: "Building Owner",
      modelPath: "/assets/npcs/building_owner.gltf",
      position: [70, 0.5, -70],
      interactionRadius: 4,
      requiredItems: ["waifu_pillow", "radio", "books"],
      getDialogue: (state: GameQuestState): DialogueLine[] => {
        const talkedBefore = state.npcTalkStates["building_owner"];
        const gathered = state.collectedSet;
        const required = ["waifu_pillow", "radio", "books"];
        const missing = required.filter((id) => !gathered.has(id));
        const hasAll = missing.length === 0;

        const item1 = state.getLabel("waifu_pillow");
        const item2 = state.getLabel("radio");
        const item3 = state.getLabel("books");

        if (!talkedBefore) {
          state.npcTalkStates["building_owner"] = true;
          return [
            {
              speaker: "You",
              text: "Wait, is that... my grandmother's handcrafted cosmic shorts up there? On top of this giant tower?!",
            },
            {
              speaker: "Building Owner",
              text: "Hey! Watch it, Cosmic Little Fella. No unauthorized citizens allowed inside the Apex Tower. Security is tight.",
            },
            {
              speaker: "You",
              text: "But you don't understand! A solar storm blew them right off my ship while I was changing, and they've landed right on your roof!",
            },
            {
              speaker: "Building Owner",
              text: "Handcrafted stardust shorts... Right. Sure. Look, I've also got my own problems. Some damn f**king kids pulled a prank and stole my absolute favorite belongings and stashed them on the highest summits in the city.",
            },
            {
              speaker: "You",
              text: "If I find them, will you let me up there?",
            },
            {
              speaker: "Building Owner",
              text: `Tell you what. Bring back "The Knight's Softening Blade" (which my records catalog as ${item1}), my old ${item2}, and my ${item3}.`,
            },
            {
              speaker: "Building Owner",
              text: "Do that, and I'll use my personal quantum teleporter to send you straight to the roof of Apex Tower. Deal?",
            },
            { speaker: "You", text: "Deal! I'm on it!" },
          ];
        }

        if (hasAll) {
          const cleanNames = [item1, item2, item3].map((n) =>
            n === "Waifu Pillow" ? "Knight's Softening Blade" : n,
          );
          return [
            {
              speaker: "You",
              text: `I did it! I've recovered your "${cleanNames.join('", "')}"!`,
            },
            {
              speaker: "Building Owner",
              text: "Incredible! You're a hero! A deal's a deal. Hold onto your helmet... activating the quantum teleporter... ZAP!",
            },
          ];
        }

        // Mid quest progress dialogue
        const gatheredIds = required.filter((id) => gathered.has(id));
        const gatheredLabels = gatheredIds.map((id) => state.getLabel(id));
        const remainingLabels = missing.map((id) => state.getLabel(id));

        if (gatheredLabels.length === 0) {
          const listStr = remainingLabels
            .map((name) =>
              name === "Waifu Pillow" ? "Knight's Softening Blade" : name,
            )
            .join(", ");
          return [
            {
              speaker: "Building Owner",
              text: `No items yet? Remember, I need you to find my: ${listStr}. They are high up on the peaks.`,
            },
            { speaker: "You", text: "Got it, I'm still searching." },
          ];
        }

        let itemNames = gatheredLabels.join(", ");
        const steps: DialogueLine[] = [
          {
            speaker: "You",
            text: `I found some of your things! I have the ${itemNames} here.`,
          },
        ];

        if (gatheredIds.includes("waifu_pillow")) {
          const cleanItemNames = itemNames.replace(
            "Waifu Pillow",
            "Knight's Softening Blade",
          );
          steps.push(
            {
              speaker: "Building Owner",
              text: "Ahem... The Knight's Softening Blade, you say?",
            },
            {
              speaker: "You",
              text: "Oh, right! Sorry, I forgot the name, teehee. Yes, I have the Knight's Softening Blade.",
            },
            {
              speaker: "Building Owner",
              text: `Ah! Outstanding! You actually recovered the ${cleanItemNames}! Excellent work.`,
            },
          );
          itemNames = cleanItemNames;
        } else {
          steps.push({
            speaker: "Building Owner",
            text: `Ah! Outstanding! You actually recovered the ${itemNames}! Excellent work.`,
          });
        }

        const remainingNamesClean = remainingLabels.map((name) =>
          name === "Waifu Pillow" ? "Knight's Softening Blade" : name,
        );
        const remainingStr =
          remainingLabels.length > 0
            ? `But I still need the rest of my collection (${remainingNamesClean.join(" and ")}) before I can activate the quantum teleporter. Keep climbing!`
            : "And that is everything! Exceptional work!";

        steps.push(
          { speaker: "Building Owner", text: remainingStr },
          {
            speaker: "You",
            text:
              remainingLabels.length > 0
                ? "I'll be back with the rest soon!"
                : "Awesome! Activate the warp pad!",
          },
        );

        return steps;
      },
      onComplete: (state: GameQuestState) => {
        // Warp player dynamically to the roof
        state.teleport(75, 275, -90);
      },
    },
    {
      id: "space_philosopher",
      name: "Space Philosopher",
      modelPath: "/assets/npcs/King.gltf",
      position: [0, 0.5, 5],
      interactionRadius: 3,
      getDialogue: (state: GameQuestState): DialogueLine[] => {
        const talkedBefore = state.npcTalkStates["space_philosopher"];

        if (!talkedBefore) {
          state.npcTalkStates["space_philosopher"] = true;
          if (state.grantBlock) {
            state.grantBlock("dirt", 5);
          }
          return [
            {
              speaker: "Space Philosopher",
              text: "Ah, a cosmic traveler graces our humble city! I felt a disturbance in the space-time fabric — a pair of legendary handcrafted shorts, descending from the heavens onto the Apex Tower roof.",
            },
            { speaker: "You", text: "You... you know about my grandmother's shorts?!" },
            {
              speaker: "Space Philosopher",
              text: "I know many things. I also know the Building Owner owns a quantum teleporter, and he's a practical man. He won't help you unless you help him first. Three of his prized possessions were stolen to the highest peaks.",
            },
            { speaker: "You", text: "Where do I even start looking?" },
            {
              speaker: "Space Philosopher",
              text: "Follow the roads south into the city. Each item has a guardian watching over it: the Adventurer stands beneath the western peak guarding 'The Knight's Softening Blade'. The Worker waits below the deep western cliffs where the radio is hidden. And the Businessman lurks near the eastern spire where the books are kept.",
            },
            {
              speaker: "Space Philosopher",
              text: "Until then, accept these 5 Earth Dirt blocks. Sometimes the simplest tools bridge the grandest gaps.",
            },
          ];
        }

        return [
          {
            speaker: "Space Philosopher",
            text: "The Knight's Softening Blade in the west with the Adventurer, the radio deeper west with the Worker, the books in the east with the Businessman. Three keys to the sky. You know where to find each of them.",
          },
          { speaker: "You", text: "I've got this. Thanks, wise one!" },
        ];
      },
    },
    {
      id: "adventurer",
      name: "Adventurer",
      modelPath: "/assets/npcs/Adventurer.gltf",
      position: [-135, 0.5, -125],
      interactionRadius: 3,
      getDialogue: (state: GameQuestState): DialogueLine[] => {
        const talkedBefore = state.npcTalkStates["adventurer"];

        if (!talkedBefore) {
          state.npcTalkStates["adventurer"] = true;
          return [
            {
              speaker: "Adventurer",
              text: "Well met! I've been watching that western building cluster from this roadside. See the tallest one with the glint near the top? That's 'The Knight's Softening Blade' — the pillow the Building Owner wants.",
            },
            { speaker: "You", text: "That high up? How do I get there?" },
            {
              speaker: "Adventurer",
              text: "I've scouted a route: climb those stacked boxes ahead, then follow the wood platforms I helped place. Watch for spinning tires near the top — they'll knock you off if you're not careful. Past those, it's a straight scramble to the ledge.",
            },
            {
              speaker: "Adventurer",
              text: "The Worker reinforced the deeper western platforms where the radio is hidden. And the Businessman is lurking near the eastern spire where the books are stashed. Each of us is watching one item for the Building Owner.",
            },
            { speaker: "You", text: "So you're all keeping an eye on the stolen goods?" },
            {
              speaker: "Adventurer",
              text: "Let's just say we all have our reasons to help you succeed. Now start climbing!",
            },
          ];
        }

        const radioCollected = state.collectedSet.has("radio");
        const booksCollected = state.collectedSet.has("books");
        const pillowCollected = state.collectedSet.has("waifu_pillow");
        const collected = [radioCollected, booksCollected, pillowCollected].filter(Boolean).length;

        if (collected >= 3) {
          return [
            {
              speaker: "Adventurer",
              text: "You got all three! Ha! I knew you had the right stuff! Go see the Building Owner at the Apex Tower — you've earned that teleporter ride!",
            },
            { speaker: "You", text: "Thanks for everything, adventurer!" },
          ];
        }

        const missing = [];
        if (!pillowCollected) missing.push("The Knight's Softening Blade (right above us!)");
        if (!radioCollected) missing.push("radio (deeper west — ask the Worker)");
        if (!booksCollected) missing.push("books (far east spire — ask the Businessman)");

        return [
          {
            speaker: "Adventurer",
            text: `Still missing some? ${missing.join(", ")}. The route for the pillow starts with those boxes and wood platforms right over there.`,
          },
          { speaker: "You", text: "I see them! Thanks!" },
        ];
      },
    },
    {
      id: "worker",
      name: "Worker",
      modelPath: "/assets/npcs/Worker.gltf",
      position: [-135, 0.5, -235],
      interactionRadius: 3,
      getDialogue: (state: GameQuestState): DialogueLine[] => {
        const talkedBefore = state.npcTalkStates["worker"];
        if (!talkedBefore) {
          state.npcTalkStates["worker"] = true;
          return [
            {
              speaker: "Worker",
              text: "Hey there! You found me on the roadside, right next to the western deep buildings. See that antenna poking out from the ledge over there? That's the radio the Building Owner's been whining about.",
            },
            { speaker: "You", text: "That's quite a climb. How do I get up there?" },
            {
              speaker: "Worker",
              text: "I built those platforms myself — they're sturdy. The trick is using the nearby buildings as stepping stones. The Adventurer can give you climbing tips, and the Philosopher might have some blocks if you need to fill gaps.",
            },
            {
              speaker: "Worker",
              text: "The pillow's back west where the Adventurer's watching, and the books are east with the Businessman. We're each stationed at one item to guide travelers like you.",
            },
            { speaker: "You", text: "Makes sense. I'll start with the item closest to me!" },
          ];
        }

        const radioHint = state.collectedSet.has("radio");
        const booksHint = state.collectedSet.has("books");
        const pillowHint = state.collectedSet.has("waifu_pillow");

        if (radioHint && booksHint && pillowHint) {
          return [
            {
              speaker: "Worker",
              text: "You got all three? The Building Owner's gonna flip! Go claim that teleporter ride — you've earned it!",
            },
            { speaker: "You", text: "Will do! Thanks for the help!" },
          ];
        }

        return [
          {
            speaker: "Worker",
            text: radioHint
              ? "You got the radio! Nice work. The books are east with the Businessman, and the pillow is back west with the Adventurer."
              : "Radio's still up there. See the antenna glinting? Start climbing the nearby structures and work your way up.",
          },
          { speaker: "You", text: "I'm on it!" },
        ];
      },
    },
    {
      id: "businessman",
      name: "Businessman",
      modelPath: "/assets/npcs/Suit.gltf",
      position: [165, 0.5, -265],
      interactionRadius: 3,
      getDialogue: (state: GameQuestState): DialogueLine[] => {
        const talkedBefore = state.npcTalkStates["businessman"];

        if (!talkedBefore) {
          state.npcTalkStates["businessman"] = true;
          return [
            {
              speaker: "Businessman",
              text: "Ah, the cosmic traveler. Been waiting on this roadside for you. See those buildings eastward? Perched up on the highest ledge — those dusty old books belong to the Building Owner.",
            },
            { speaker: "You", text: "And you're watching them for him?" },
            {
              speaker: "Businessman",
              text: "Hardly. I'm watching them for my syndicate. Those books contain property deeds and blueprints of the Apex Tower's quantum teleporter. If you retrieve them, I'd like a quick peek before returning them to the Building Owner.",
            },
            {
              speaker: "Businessman",
              text: "The Adventurer guards the pillow on the western peak. The Worker watches the radio in the deep west. And I'm here for the books. We all have our own agendas, but we all need you to succeed.",
            },
            { speaker: "You", text: "I'll get those books down. But no promises about sharing corporate secrets." },
          ];
        }

        const hasRequired = state.collectedSet.has("waifu_pillow") && state.collectedSet.has("radio") && state.collectedSet.has("books");

        if (hasRequired) {
          return [
            {
              speaker: "Businessman",
              text: "You got all three! Don't forget our little arrangement — when you're on that roof, take a quick look at the teleporter's control panel. My syndicate will make it worth your while.",
            },
            { speaker: "You", text: "I'll think about it. First, I need my grandmother's shorts back." },
          ];
        }

        return [
          {
            speaker: "Businessman",
            text: "Still collecting? The books are right up there — scale the eastern buildings and you'll find them. The Adventurer and Worker are watching the other two items out west.",
          },
          { speaker: "You", text: "Getting there." },
        ];
      },
    },
  ],
};

/**
 * Returns pants collection dialogue.
 */
export const getPantsRetrievedDialogue = (
  pantsLabel: string,
): DialogueLine[] => [
  {
    speaker: "You",
    text: `YES! My grandmother's legendary ${pantsLabel}! Still warm and smelling of stardust!`,
  },
  {
    speaker: "You",
    text: "Now, I must make my way back to my UFO at the eastern launch pad and head home!",
  },
];

/**
 * Returns final UFO boarding dialogues and branch descriptions.
 */
export const getUfoBoardingDialogue = (
  hasPants: boolean,
  pantsLabel: string,
): DialogueLine[] => {
  if (hasPants) {
    return [
      {
        speaker: "You",
        text: `Ah, home sweet UFO! My grandmother's legendary ${pantsLabel} are safely back on!`,
      },
      {
        speaker: "Narrator",
        text: "With the heirloom retrieved and your dignity fully restored, you fired up the cosmic thrusters and soared into the endless night sky.",
      },
      {
        speaker: "Narrator",
        text: "Warm, stylish, and proud, you are now ready for your next galactic adventure. BEST ENDING!",
      },
    ];
  } else {
    return [
      {
        speaker: "You",
        text: `Well... I couldn't get my ${pantsLabel}. But I can't fly around the galaxy in my underwear forever...`,
      },
      {
        speaker: "Narrator",
        text: "You decided to fire up the engines, flew to the nearest mega space-mall, and bought a generic pair of gray sweatpants.",
      },
      {
        speaker: "Narrator",
        text: "Safe and warm, but forever missing that custom stardust touch. MEDIOCRE ENDING!",
      },
    ];
  }
};
