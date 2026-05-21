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
      position: [70, 0.2, -70],
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
      modelPath: "/assets/npcs/building_owner.gltf",
      position: [0, 0.0, 5],
      interactionRadius: 3,
      getDialogue: (state: GameQuestState): DialogueLine[] => {
        const talkedBefore = state.npcTalkStates["space_philosopher"];

        if (!talkedBefore) {
          state.npcTalkStates["space_philosopher"] = true;
          // Award block gift
          if (state.grantBlock) {
            state.grantBlock("dirt", 5);
          }
          return [
            {
              speaker: "Space Philosopher",
              text: "Greetings, cosmic traveler. Did you know that the entire universe is just a sequence of platform levels?",
            },
            { speaker: "You", text: "Wait... what? Really? Are we in a game?" },
            {
              speaker: "Space Philosopher",
              text: "Indeed. Here, accept these 5 Earth Dirt blocks as a gift. They may help you bridge some impossible gaps!",
            },
            { speaker: "You", text: "Wow, thank you! I will use them wisely!" },
          ];
        }

        return [
          {
            speaker: "Space Philosopher",
            text: "Remember: never look down, control your momentum, and always double-jump in spirit.",
          },
          { speaker: "You", text: "Deep... very deep." },
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
