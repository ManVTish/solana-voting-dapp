import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Voting } from "@/../anchor/target/types/voting";
import { BN, Program } from "@coral-xyz/anchor";
const IDL = require('@/../anchor/target/idl/voting.json');

export const OPTIONS = GET;

export async function GET(request: Request) {
    const actionMetadata: ActionGetResponse = {
        icon: "https://www.pngfind.com/pngs/m/33-333200_download-svg-download-png-vote-icon-png-transparent.png",
        title: "Vote for your leader!",
        description: "Vote between Modi & trump",
        label: "Vote",
        links: {
            actions: [
                {
                    label: 'Vote for Modi',
                    href: 'http://localhost:3000/api/vote?candidate=Modi',
                    type: "transaction"
                },
                {
                    label: 'Vote for trump',
                    href: 'http://localhost:3000/api/vote?candidate=trump',
                    type: "transaction"
                }
            ]
        },
    };

    return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request){
    const url = new URL(request.url);
    const candidate = url.searchParams.get("candidate");

    if(candidate != 'Modi' && candidate !='trump'){
        return new Response('Invalid candidate', { status: 400, headers: ACTIONS_CORS_HEADERS });
    }

    const connection = new Connection("http://localhost:8899", "confirmed");
    const program: Program<Voting> = new Program(IDL, { connection });
    const body: ActionPostRequest = await request.json();

    let voter;
    try {
        voter = new PublicKey(body.account);
    } catch (error){
        return new Response("Invalid Account", { status: 400, headers: ACTIONS_CORS_HEADERS })
    }

    const instruction = await program.methods.vote(candidate, new BN(1))
    .accounts({
        signer: voter,
    })
    .instruction();

    const blockhash = await connection.getLatestBlockhash();

    const transaction = new Transaction({
        feePayer: voter,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight
    }).add(instruction);

    const response = await createPostResponse({
        fields:  {
            type: 'transaction',
            transaction: transaction
        }
    });

    return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}

