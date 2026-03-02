"use client"

import { useState } from "react";
import { FaFaceAngry } from "react-icons/fa6";
import { ImSad2,  ImNeutral2 } from "react-icons/im";
import { FaSmile, FaSmileBeam } from "react-icons/fa";

export default function MoodSelector(){
    const [selectedMood, setSelectedMood] = useState(null);

    const moods = [
        { value: 1, icon: <FaFaceAngry size={40}/>, color: "#FA5659", hover: "#ffb3ba" },
        { value: 2, icon: <ImSad2 size={40}/>, color: "#F7A34A", hover: "#ffdfba" },
        { value: 3, icon: <ImNeutral2 size={40}/>, color: "#F8D042", hover: "#ffffba" },
        { value: 4, icon: <FaSmile size={40}/>, color: "#62B64D", hover: "#baffc9" },
        { value: 5, icon: <FaSmileBeam size={40}/>, color: "#484572", hover: "#bae1ff" },
    ];

    return(
        <div className="flex flex-wrap justify-center mt-6 gap-2">

            <input type="hidden" name="mood_id" value={selectedMood ?? ""} />

            {moods.map((mood) => (
              <button
                key={mood.value}
                type="button"
                onClick={
                    () => {setSelectedMood(mood.value);
                    }
                }
                className={`p-6 rounded-xl text-xl transition-colors
                  ${selectedMood === mood.value
                    ? "bg-gray-200 scale-110"
                    : "bg-transparent hover:bg-gray-100"}
                `}
                style={{ color: mood.color }}
              >
                <span className="material-symbols-outlined">
                  {mood.icon}
                </span>
                <span className="w-full h-1 bg-amber-200"></span>
              </button>
          ))}
        </div>
    )
}