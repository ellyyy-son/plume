'use client'

import { deleteEntry } from "./server";

export default function DeleteButton({ id }: { id: string }) {
  return (
    <button onClick={() => deleteEntry(id)}>
      Delete
    </button>
  );
}