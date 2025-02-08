// src/app/api/trees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDb } from '@/lib/mongodb';
import Tree from '@/models/tree';

// 1) CREATE a New Tree (POST)
export async function POST(req: NextRequest) {
  try {
    await connectToDb(); 
    const body = await req.json();

    const {
      owner,
      treeId,
      species,
      growthStage,
      row,
      col,
      assignedTask,
      metadataCID,
    } = body;

    const newTree = await Tree.create({
      owner,
      treeId,
      species,
      growthStage,
      row,
      col,
      assignedTask,
      metadataCID,
    });

    return NextResponse.json({ success: true, data: newTree }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tree:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2) READ / GET Trees (GET)
export async function GET(req: NextRequest) {
  try {
    await connectToDb();
    const { searchParams } = new URL(req.url);

    const owner = searchParams.get('owner');

    let query: any = {};
    if (owner) {
      query.owner = owner;
    }

    const trees = await Tree.find(query); 

    return NextResponse.json({ success: true, data: trees });
  } catch (error: any) {
    console.error('Error fetching trees:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


