

![](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/694417df4f1721cccbfed9b6_Untitled-1.jpg)

# GenLayer Roadmap to Mainnet

GenLayer is not your typical blockchain. It brings subjectivity and non-determinism via LLMs and web browsing on-chain making it the first of its kind. The Optimistic Democracy consensus paired with the Equivalence Principle forms a new algorithm with many edges and actors involved. Let's go back to the beginning to shed light onto the current roadmap.

It all started with Albert, Edgars and JM crafting the original whitepaper and tracing a course from an idea to a fully fledged trustless decision-making protocol. GenLayer Labs was born.

## Core Architecture & Teams

It's important to understand all the pieces that comprise GenLayer in order to understand the roadmap. The org structure is a great place to start as it showcases the different technical teams and their ownerships: GenVM, Consensus, Node, DevExp.

The GenVM is the heart of GenLayer and our flavor of Virtual Machine that runs the Intelligent Contracts. These are written in Python, but interpreted in a WASM runtime. It provides all the primitives needed by the Builders to run non-deterministic blocks and write contracts and provides the execution environment. For the validators, it also provides Grayboxing, an intermediate middleware (via LUA scripts) where they can add extra security and correctness for the whole protocol. We are glad to share that with the recent addition of image processing, GenLayer's GenVM is mostly ready for prime time. Only a few nip-tucks here and there; some documentation improvements and examples are being iterated on.

The Consensus team is in charge of writing the contracts that execute the Optimistic Democracy mechanics: leader & validator selection, commit-and-reveal voting, rotations, appeals, staking and fees. Staking has just been launched; fees (gas, penalties and rewards) are currently being worked on as the final step. All these are contracts written in solidity that run in the GenLayer Chain.

The Node is the glue that links the Consensus with the GenVM. They started from scratch writing the node binary in golang, and implemented the db syncing, listening to the consensus contracts, executing the GenVM and reporting back the results via commit-reveal to the Consensus. The work is mostly done, some node-ops related tasks remain for scalability and maintenance.

The DevExp team first created the Studio, which is a fully simulated centralized version of GenLayer. It validated the whole idea and allowed us to start building on top of GenLayer and is our main tool to develop, and some projects are already using it in production. After launching Rally a big update was made to improve its scalability. There are no blocking features on the roadmap. The Explorer is another important piece which gets updated after every new consensus upgrade. Some work remains regarding developer tools, but nothing major.

Another big aspect is the correctness of GenLayer. The team has been working on many simulations of the consensus, malicious actors and fees to ensure that the consensus has every incentive aligned among the different participants and is resilient to attacks. We are currently working on a formal TLA+ specification to finish this area of research with a cherry on top.

## Infrastructure & Network Design

With so many novel concepts that make GenLayer unique we decided to focus all our work on these pieces while trying not to reinvent the wheel and to build on top of existing solid bases where possible. ZKsync was our chosen solution to handle the deterministic side of the consensus with ZK proofs and sub second settlement. We are really happy with this decision given how stable it is, and all the features they are constantly releasing. We call this layer the GenLayer Chain, an L2 EVM compatible, powered by [@zksync](https://x.com/@zksync). They have been great partners!

On top of that, we have an overlay, called the GenLayer Network, where we run our own Validator nodes executing the GenVM and the Optimistic Democracy consensus. All the magic happens here: Intelligent Contracts, non-deterministic operations, consensus, appeals, etc.

![](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/694412ef3cf93a8d1694fc86_G8ZYGQAXgAACEuz.png)

## Testnet Strategy

Given all these moving pieces, we needed to test everything working together in coordination. A moving, evolving Testnet was the correct setup. We decided to do a multi step Testnet rollout composed of three stages (that will live in parallel): Testnet's Asimov, Bradbury and Clarke.

## Testnets: Asimov, Bradbury, Clarke

Testnet Asimov was the first one, currently active and on phase 4 and its purpose is to test the infrastructure layer for stability and scalability. It's volatile, as we have introduced breaking changes along the way, resetting its history, and it's not meant to be stable as we run stress tests to learn about its maximum throughput and run new versions of the nodes that might not be yet stable. It's not meant for builders, but for node operators and the core team. It's also meant for low level security researchers, finding and trying to exploit vulnerabilities that might bring the Testnet down in the process. The consensus contracts are written on Solidity and run on the GenLayer Chain and Asimov is the perfect fit to test all of the different flows that the consensus might take including rotations, appeals and tribunals.

Testnet Bradbury is around the corner. It will be live within weeks. Its main focus is AI and for all to learn together (Core team, Validators and Builders) about how to configure and use the nodes to achieve the best performance of the network. It's a greenfield for research where we have many ideas that we'd like to try between ourselves and the community. Here we will answer some questions like, what's the best LLM for each contract, how penalties and rewards are applied to honest, lazy and malicious validators, how and when to appeal. We envision many different benchmarks and researchers experimenting to improve GenLayer. We need active involvement from the Validator community since they are the ones who will benefit most by these learnings.

Testnet Clarke will be a Mainnet release candidate. It will be stable and builders can expect the same performance and stability as on Mainnet. New features will be tested here before the official release, and it will be subsidized for Builders to iterate and experiment. This is the last stop before Mainnet.

![](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/6944134c7d773618addae35a_G8ZYBGSWAAA4MH0.png)

## Path to Mainnet

Once Testnet Clarke is up and running we will start the final security audits before going live on Mainnet.

Summing up: all the core teams are either finished or taking their final leap. Testnet Bradbury is the next big step, and shortly after Testnet Clarke.

We are very excited to be nearing Mainnet after years of hard work and bringing to fruition that spark of an idea that was first shared in the whitepaper. We are creating GenLayer together and are glad to be sharing this journey with you. Exciting times ahead!  
  
Don't miss our Builders Program at [points.genlayer.foundation](https://points.genlayer.foundation/).