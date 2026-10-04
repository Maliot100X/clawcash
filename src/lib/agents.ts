export type Agent = {
  id: string;
  name: string;
  role: string;
  color: string;
  glb: string;
  /** Height multiplier after the body is normalized. 1 is a full person. */
  fit?: number;
};

const cdn = "https://three.ws/avatars";

export const agents: Agent[] = [
  { id: "claw", name: "CLAW", role: "Desk · X-Bot", color: "#ff4b1f", glb: `${cdn}/xbot.glb` },
  { id: "rena", name: "RENA", role: "Feed · Michelle", color: "#f4ede4", glb: `${cdn}/michelle.glb` },
  { id: "aure", name: "AURE", role: "Copy · scan", color: "#e8b15a", glb: `${cdn}/realistic-male.glb` },
  { id: "vesper", name: "VESPER", role: "Vault · scan", color: "#3ddc97", glb: `${cdn}/realistic-female.glb` },
  { id: "cz", name: "CZ", role: "Floor · marketplace", color: "#9ad7ff", glb: `${cdn}/cz.glb` },
  { id: "cesium", name: "CESIUM", role: "Scout · reference", color: "#7eb6ff", glb: `${cdn}/cesium-man.glb` },
  { id: "form", name: "FORM", role: "Studio · mannequin", color: "#c9b8a4", glb: `${cdn}/mannequin.glb` },
  { id: "kits", name: "KITS", role: "Mascot · fox", color: "#ff6b7a", glb: `${cdn}/fox.glb`, fit: 0.58 },
];

export const collection = [
  {
    src: "/collection/agent.jpg",
    title: "CLAW",
    text: "Obsidian plates, ember joints. The desk agent.",
  },
  {
    src: "/collection/planet.jpg",
    title: "Planet",
    text: "The arena world the three agents walk.",
  },
  {
    src: "/collection/mark.jpg",
    title: "Mark",
    text: "The claw relief, cast like a launch token.",
  },
  {
    src: "/collection/arena.jpg",
    title: "Hall",
    text: "Where the feed becomes a floor.",
  },
  {
    src: "/collection/talons.jpg",
    title: "Talons",
    text: "Ember, bone, and gold. The mark, flat.",
  },
] as const;
