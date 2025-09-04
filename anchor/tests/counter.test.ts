import * as anchor from '@coral-xyz/anchor'
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Voting } from '../target/types/voting'
const IDL = require("../target/idl/voting.json");

const votingAddress = new PublicKey("z6Uw5iAzPGjNqXeyDPHUHJJevYAobz6yviPcdqED32L");

describe('Voting', () => {
  // Configure the client to use the local cluster.
  let context;
  let provider;
  anchor.setProvider(anchor.AnchorProvider.env());
  let votingProgram = anchor.workspace.Voting as Program<Voting>;

  beforeAll(async() => {
    /*context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);
    provider = new BankrunProvider(context);

    votingProgram = new Program<Voting>(
      IDL,
      provider,
    );*/
  });

  it('Initialize Polling', async () => {
    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      "Who will you vote for?",
      new anchor.BN(0),
      new anchor.BN(1756318608),
    ).rpc();
    
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);
    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual("Who will you vote for?");
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });

  it('Initialize Candiate', async () => {
    await votingProgram.methods.initializeCandidate(
      "Modi",
      new anchor.BN(1),
    ).rpc();

    await votingProgram.methods.initializeCandidate(
      "trump",
      new anchor.BN(1),
    ).rpc();

    const [modiAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Modi")],
      votingAddress
    );

    const [trumpAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("trump")],
      votingAddress
    );

    const modiCandidate = await votingProgram.account.candidate.fetch(modiAddress);
    const trumpCandidate = await votingProgram.account.candidate.fetch(trumpAddress);

    console.log(modiCandidate);

    expect(modiCandidate.candidateVotes.toNumber()).toEqual(0);
    expect(trumpCandidate.candidateVotes.toNumber()).toEqual(0);
    expect(modiCandidate.candidateName).toEqual('Modi');
  });

  it('Vote', async () => {
    await votingProgram.methods.vote(
      "Modi",
      new anchor.BN(1),
    ).rpc();

    const [modiAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Modi")],
      votingAddress
    );

    const modiCandidate = await votingProgram.account.candidate.fetch(modiAddress);
    expect(modiCandidate.candidateVotes.toNumber()).toEqual(1);
    expect(modiCandidate.candidateName).toEqual("Modi");
  });
})
