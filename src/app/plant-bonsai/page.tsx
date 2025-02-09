"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OpenAI from 'openai';

export default function PlantBonsai() {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskName.trim()) {
      setError("Task Name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const prompt = `Prompt: Task Breakdown Tree Generator\n\nSystem Instruction:\nYou are an AI assistant that helps users break down tasks into structured, actionable subtasks. Your goal is to generate a three-level task tree in JSON format, ensuring:\n\nThe root task is broken into a suitable number of high-level subtasks (up to a maximum of four).\n\nEach of those subtasks can have a suitable number of child subtasks (up to a maximum of four).\n\nThe final level contains the most granular steps (leaf nodes), with a suitable number of subtasks (up to four per parent node).\n\nAll tasks should be clear, actionable, and logically sequenced.\n\nUser Input Example:\n\n{\n  \"task\": \"Plan a birthday party\"\n}\n\nExpected Output Format:\n\n{\n  \"task\": \"Plan a birthday party\",\n  \"subtasks\": [\n    {\n      \"task\": \"Choose a date and venue\",\n      \"subtasks\": [\n        { \"task\": \"Check everyone's availability\", \"subtasks\": [] },\n        { \"task\": \"Book the venue\", \"subtasks\": [] }\n      ]\n    },\n    {\n      \"task\": \"Send out invitations\",\n      \"subtasks\": [\n        { \"task\": \"Create a guest list\", \"subtasks\": [] },\n        { \"task\": \"Design the invitation\", \"subtasks\": [] },\n        { \"task\": \"Send invitations\", \"subtasks\": [] }\n      ]\n    },\n    {\n      \"task\": \"Plan food and drinks\",\n      \"subtasks\": [\n        { \"task\": \"Decide on a menu\", \"subtasks\": [] },\n        { \"task\": \"Order catering or groceries\", \"subtasks\": [] }\n      ]\n    },\n    {\n      \"task\": \"Arrange entertainment and activities\",\n      \"subtasks\": [\n        { \"task\": \"Book a DJ or music\", \"subtasks\": [] },\n        { \"task\": \"Plan games or activities\", \"subtasks\": [] },\n        { \"task\": \"Set up decorations\", \"subtasks\": [] }\n      ]\n    }\n  ]\n}\n\nFinal Instructions to the LLM:\n\nEnsure exactly three levels in the tree.\n\nEach level should have a suitable number of subtasks (up to four per parent node, but not necessarily all four).\n\nThe output must be in valid JSON format.\n\nSubtasks should be meaningful and logically sequenced.\n\nUser Input:\n\n{\n  \"task\": \"${taskName}\"${description.trim() ? `, \"description\": \"${description}\"` : ""}\n}`;
      // console.log(process.env.NEXT_PUBLIC_OPENAI_API_KEY);
      const client = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser: true });

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      console.log('AI Response:', response);

      // Redirect to the garden after successful response
      // router.push('/garden');
    } catch (err: any) {
      console.error('Error generating task tree:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-2xl font-semibold">Plant a New Bonsai</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4 w-1/3">
        <input
          type="text"
          placeholder="Task Name"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <textarea
          placeholder="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        ></textarea>
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-3 rounded-lg text-white ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {loading ? 'Planting...' : 'Plant Bonsai'}
        </button>
      </form>
      {error && <p className="mt-4 text-red-500">⚠️ {error}</p>}
      <button
        onClick={() => router.push('/')}
        className="mt-4 text-blue-600 underline"
      >
        Back to Home
      </button>
    </div>
  );
}
