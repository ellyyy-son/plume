"use client"
import { useState } from "react";
import { FaFaceAngry } from "react-icons/fa6";
import { ImSad2, ImNeutral2 } from "react-icons/im";
import { FaSmile, FaSmileBeam } from "react-icons/fa";

export default function MoodSelector() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [hoveredMood, setHoveredMood] = useState<number | null>(null);

  const moods = [
    { value: 5, icon: <FaFaceAngry size={40} />, color: "#FA5659", hover: "#ffb3ba" },
    { value: 4, icon: <ImSad2 size={40} />, color: "#F7A34A", hover: "#ffdfba" },
    { value: 3, icon: <ImNeutral2 size={40} />, color: "#F8D042", hover: "#ffffba" },
    { value: 2, icon: <FaSmile size={40} />, color: "#62B64D", hover: "#baffc9" },
    { value: 1, icon: <FaSmileBeam size={40} />, color: "#484572", hover: "#bae1ff" },
  ];

  return (
    <div className="flex flex-wrap justify-center mt-6 gap-2">
      <input type="hidden" name="mood_id" value={selectedMood ?? ""} />
      {moods.map((mood) => {
        const isSelected = selectedMood === mood.value;
        const isHovered = hoveredMood === mood.value;

        return (
          <button
            key={mood.value}
            type="button"
            onClick={() => setSelectedMood(mood.value)}
            onMouseEnter={() => setHoveredMood(mood.value)}
            onMouseLeave={() => setHoveredMood(null)}
            className={`p-6 rounded-xl text-xl transition-all ${isSelected ? "scale-110" : ""}`}
            style={{
              color: mood.color,
              backgroundColor: isSelected || isHovered ? mood.hover : "transparent",
            }}
          >
            <span className="material-symbols-outlined">
              {mood.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
}