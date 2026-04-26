import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import TaskListClient from "./tasklistclient"
import FilterButtons from "./filterbuttons"
import AddTaskButton from "./addtaskbutton"
import Image from "next/image";
import Link from "next/link";

type TaskWithDifficulty = {
  id: string
  is_complete: boolean
  completion_datetime: string | null
  task_deadline: string | null
  created_at: string
  task_difficulty: string
  difficulty?: {
    difficulty_name: string
    difficulty_expamount: number
  }
}

type PetData = {
  pet_model: string;
  pet_type: string;
} | null;

type CharacterData = {
  userName: string;
  petName: string;
  expAmount: number;
  pet: PetData;
  slots: { slot_name: string; x: number; y: number }[];
  equippedAccessories: {
    equipped_id: string;
    slot: string;                
    accessory_owned: {
      accessory_id: string;
      accessory: {
        accessory_url: string;
        accessory_name: string;
      } | null;
    } | null;
  }[];
};

type CharacterResult =
  | { kind: "notFound" }
  | { kind: "notSelected" }
  | { kind: "ready"; data: CharacterData };

async function getCharacterSummary(): Promise<CharacterResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { kind: "notFound" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("user_id, username, virtual_petid, exp_amount")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { kind: "notFound" };
  }

  if (!profile.virtual_petid) {
    return { kind: "notSelected" };
  }

  const { data: userPet, error: userPetError } = await supabase
    .from("user_pet")
    .select("pet_name, mood_id, pet_id")
    .eq("virtual_petid", profile.virtual_petid)
    .maybeSingle();

  if (userPetError || !userPet) {
    return { kind: "notFound" };
  }

  const moodId = Number(userPet.mood_id);

  const { data: pet } = await supabase
  .from("pet")
  .select("pet_model, pet_type")
  .eq("pet_id", userPet.pet_id)
  .maybeSingle();

  const { data: petMood } = await supabase
  .from("pet_mood")
  .select("image_url")
  .eq("pet_id", userPet.pet_id)
  .eq("mood_id", moodId)
  .maybeSingle();
  
  const { data: slots } = await supabase
  .from("slot")
  .select("slot_name, x, y")
  .eq("pet_id", userPet.pet_id);

  const { data: equippedAccessories } = await supabase
  .from("pet_accessory_equipped")
  .select("equipped_id, slot, accessory_owned(accessory_id, accessory(accessory_url, accessory_name))")
  .eq("virtual_petid", profile.virtual_petid)
  .returns<CharacterData["equippedAccessories"]>();


  return {
    kind: "ready",
    data: {
      userName: profile.username,
      expAmount: profile.exp_amount ?? 0,
      petName: userPet.pet_name || "My Pet",
      pet: pet ? { 
         pet_type: pet.pet_type, 
         pet_model: petMood?.image_url ?? pet.pet_model  // fallback to base model
      } : null,
      equippedAccessories: equippedAccessories ?? [],
      slots: slots ?? [],
    },
  };
}


async function CharacterPanel({
  getCharacter,
}: {
  getCharacter: Promise<CharacterResult>;
}) {
  const data = await getCharacter;

  if (data.kind === "notFound") {
    return (
      <div className="rounded-2xl border-4 border-[#E4DCAB] p-6 bg-[#fef5ffbb]">
        <p className="font-delius text-lg text-[#2E2805]">Please log in to see your character.</p>
      </div>
    );
  }

  if (data.kind === "notSelected") {
    return (
      <div className="rounded-2xl border-4 border-[#E4DCAB] p-6 bg-[#fef5ffbb]">
        <p className="font-delius text-lg text-[#2E2805] mb-3">
          You have not selected a pet yet.
        </p>
        <Link href="/pet-selection" className="font-delius underline text-[#C17F9E]">
          Choose your pet now
        </Link>
      </div>
    );
  }

  const character = data.data;
  if (!character.pet) {
    return (
      <div className="rounded-2xl border-4 border-[#E4DCAB] p-6 bg-[#fef5ffbb]">
        <p className="font-delius text-lg text-[#2E2805]">Pet image unavailable. Please select a pet again.</p>
        <Link href="/pet-selection" className="font-delius underline text-[#C17F9E]">Re-select pet</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end -z-1 translate-y-32">
        <Image src={character.pet.pet_model} alt={character.pet.pet_type} width={170} height={170}/>
        {character.equippedAccessories.map((acc) => {
           const item = acc.accessory_owned?.accessory;
           if (!item) return null;
              
           const pos = character.slots.find((s) => s.slot_name === acc.slot);
              
           return (
             <Image
              key={acc.equipped_id}
              src={item.accessory_url}
              alt={item.accessory_name}
              width={170}
              height={170}
              className="absolute object-contain"
             />
            );
         })}
    </div>
  );
}

export default async function Page({ 
  searchParams 
}: { 
  searchParams: Promise<{ filter?: string }>
}) {
  const supabase = await createClient(); 
  const { filter } = await searchParams
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("You must be signed in to view your tasks.")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("exp_amount")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profileError) {
    throw new Error("Unable to load your profile progress.")
  }

  const { data: allTasks } = await supabase
    .from('task')
    .select('*')
    .eq('user_id', user.id)

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)

  let query = supabase
    .from('task')
    .select('*')
    .eq('user_id', user.id)

  if (filter === 'daily') {
    query = query
      .gte('task_deadline', startOfToday.toISOString())  // WHERE deadline >= start_of_today
      .lt('task_deadline', endOfToday.toISOString())     // AND deadline < end_of_today
  } else if (filter === 'week') {
    query = query
      .gte('task_deadline', startOfToday.toISOString())  // WHERE deadline >= start_of_today
      .lt('task_deadline', endOfWeek.toISOString())      // AND deadline < end_of_week
  } else if (filter === 'complete'){
    query = query
    .eq('is_complete', true)
  } else if (filter === 'pending'){
    query = query
    .eq('is_complete', false)
  }

  const { data: tasks } = await query
  const { data: difficulties } = await supabase.from('difficulty').select('*')
  const completedTasks = (tasks ?? []).filter(task => task.is_complete)
  const pendingTasks = (tasks ?? []).filter(task => !task.is_complete)
  const expPoints = profile?.exp_amount ?? 0
   const character = getCharacterSummary();

  return (
    <div className='mx-12 ml-32 flex flex-col gap-8'>
      <div className='flex justify-between items-end'>
        <div className='bg-white outline-[#ADD3EA] outline-4 p-4 rounded-2xl w-fit h-15'>
          <h2 className='font-delius text-2xl'>EXP Points: {expPoints}</h2>
        </div>
        <CharacterPanel getCharacter={character}/>
      </div>
      
      <div className='flex flex-col gap-8'>
        <FilterButtons currentFilter={filter}/>

        <div className='flex flex-col items-center justify-center bg-[#D7CFA7] rounded-2xl w-full z-2'>
          <p className='font-cherry text-5xl text-center p-12'>
            {filter === 'daily' ? "Today's Tasks" : filter === 'week' ? "This Week's Tasks" : "All Tasks"}
          </p>
        
        <div className="grid grid-template-rows-2 w-full bg-[#FBF5D1] border-[#CCC38D] border-x-4 border-b-4 rounded-b-2xl">
          <div className='justify-self-end flex flex-col w-40 mt-4 mr-12'>
            <AddTaskButton difficulties={difficulties ?? []}/>
          </div>

          {tasks && tasks.length > 0 ? (
            <div className='flex flex-col font-delius px-10 pb-5'>
              
              {filter !== 'complete' && (
                <div>
                <h2>Pending Tasks</h2>
                <TaskListClient tasks={pendingTasks} mode="pending" difficulties={difficulties ?? []} />
                </div>
              )}

              {filter !== 'pending' &&(
               <div>
                <h2>Completed Tasks</h2>
                <TaskListClient tasks={completedTasks} mode="completed" difficulties={difficulties ?? []} />
              </div> 
              )}
            </div>
          ) : (
            <div className='flex flex-col bg-[#FBF5D1] font-delius p-10 rounded-b-2xl w-full'>
              <p>No tasks available</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}
