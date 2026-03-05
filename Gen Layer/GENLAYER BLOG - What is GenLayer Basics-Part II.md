![](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/684b1bd8d70520d930696a58_21.avif)

# What is GenLayer [Basics-Part II]

After introducing the innovative concept of an Intelligent Blockchain, let’s dive deeper into GenLayer’s inner workings. In this part, you will learn about the execution environment GenVM, the role of validators, and the consensus mechanism of Optimistic Democracy.

## GenVM: The Execution Environment Combining AI and Blockchain

GenVM is an account-based system. This means that [GenLayer](https://genlayer.com/) allows Externally Owned Accounts as well as Intelligent Contract accounts.

![](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/6846edc31bddc967b40b396a_66d87a7beb52e3a8fabafb3f_66d8654a15bbb7fada28ad9f_What%252520is%252520GenLayer_%252520%25255BThe%252520Fundamentals-Part%2525202%25255D%2525201.avif)

Comparison Externally Owned Accounts and Contract Accounts; Source: research.despread.io

Like in the Ethereum Virtual Machine (EVM), the first mentioned type can be created by users with an external private key and the latter whenever an Intelligent Contract is deployed. Deploying contracts on GenLayer is a straightforward process. **Developers write their Intelligent Contracts using a Python-based language and submit them to the network.** Once deployed, these contracts become self-executing and can interact with other contracts’ external data on the World Wide Web — all while being able to process human prompts.

Transactions in GenVM are the primary means of interacting with [Intelligent Contracts](https://www.genlayer.com/post/genlayer-the-intelligence-layer-of-the-internet). When a user submits a transaction, it is broadcast to the network and picked up by validators for execution. Unlike traditional blockchains like Ethereum, where state changes occur after every block, **GenLayer updates the state after every transaction.** This allows for faster and more efficient processing of transactions.

## Consensus Mechanism in GenVM

First of: All GenLayer validators are connected to Large Language Models (LLMs) as they are the ones executing transactions. Once a transaction is submitted one random “lead” validator that is connected to an LLM processes the transaction and proposes an outcome. Basically this outcome is a new desired state of the blockchain.

Example: A has 1 ETH, B has 0 ETH. If A transfers 1 ETH to B the new state of the blockchain would accordingly show the new balances. A now has 0 ETH, B has 1 ETH.

In the first step, a small subset of minimum 5 validators execute the same transaction and compare their outputs with the leader’s. If a majority of the validators agree with the leader’s output, it is considered valid. This mechanism maintains the integrity of the network by ensuring that all validators arrive at the same conclusion.

![](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/6846edc0c755294649baeb84_66d87a7beb52e3a8fabafb42_66d8658e9a897eb6af73a6af_What%252520is%252520GenLayer%252520%25255BThe%252520Fundamentals-Part%252520II%25255D%252520graphic%2525201%252520\(1\).avif)

Consensus After Leader Proposes Result

This approach allows for fast and efficient processing of transactions, as only a small subset of validators is required to reach consensus. However, safeguards are in place to ensure the accuracy and reliability of the network. To incentivize validators and cover the costs of executing Intelligent Contracts, [GenLayer](http://genlayer.com/) introduces a native gas token called GEN. Users pay transaction fees in GEN, which are then distributed to the validators as a reward for their services.

## Optimistic Democracy

Optimistic Democracy is the consensus mechanism that powers GenLayer. It ensures that validators reach an agreement on the state of the network and the validity of transactions. If a transaction is deemed invalid or if there is a disagreement among validators, the transaction enters a process called Appeals. In this process, additional validators are brought in to resolve the dispute.

Once a transaction has gone through the [Optimistic Execution](https://www.genlayer.com/post/optimistic-execution-agreeing-on-the-unagreeable) process and any necessary appeals, it reaches a state of Finality. In Ethereum, for example, finality is typically reached within 6–12 minutes after a transaction is included in a block. GenLayer’s main purpose is not fast finality, as validation significantly differs from Ethereum block validation. It can take up to several hours to leave time for appeals, which makes the system more reliable.

[We are putting the power in the hands of the developers](https://www.genlayer.com/post/optimistic-execution-agreeing-on-the-unagreeable) as they can choose how much certainty they want for their specific project or transactions. Once Finality is reached, the transaction is permanently recorded on the blockchain and cannot be altered or reversed, ensuring immutability. In rare cases, a transaction may be classified as Undetermined if the validators cannot reach a consensus even after multiple rounds of appeals. The protocol handles these edge cases to ensure the stability and security of the network.

### How do Validators Work Together?

GenLayer operates as a Delegated Proof of Stake (DPoS) blockchain, where the community elects validators through a voting process. Users have to stake their GEN tokens to support their chosen validators. DPoS is not a completely new consensus mechanism and has been successfully implemented in other major blockchains such as Cosmos, Tron, and Polygon.

What sets GenLayer apart is that the [validators are powered by Large Language Models (LLMs)](https://www.genlayer.com/post/what-is-genlayer-the-fundamentals-part-i). This unique combination of AI and blockchain technology enables the execution of Intelligent Contracts and opens up new use cases for decentralized applications.

![](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/6846edc31bddc967b40b3967_66d87a7beb52e3a8fabafb3a_66d86570187614d704b1c6b0_What%252520is%252520GenLayer%252520%25255BThe%252520Fundamentals-Part%252520II%25255D%252520graphic%2525202%252520\(1\).avif)

Interplay Delegation and Validation

The top validators with the most votes validate transactions and participate in the consensus process. **For users, interacting with GenLayer is similar to using any other blockchain.** They can send transactions, deploy contracts, and interact with dApps built on the platform. True innovation happens behind the scenes, with the integration of AI.

[GenLayer](http://genlayer.com/) also introduces a new type of network participant called Proposers. **The good thing about it? You could also be a Proposer!** Proposers are random people, companies, or entities that submit proposals to Intelligent Contracts for validation. For example, a news aggregator Intelligent Contract may rely on Proposers to submit relevant articles and summaries. These Proposers are then incentivized to provide accurate and valuable information to the network with tokens!

You might come up with the question why GenLayer is not using the most popular [consensus mechanism Proof of Stake](https://www.genlayer.com/post/genlayer-the-intelligence-layer-of-the-internet) (PoS). GenLayer’s consensus mechanism must be DPoS because validators need to be powerful LLMs to process the complex inputs of Intelligent Contracts, which would be impractical in a casual PoS system. DPoS ensures that only the most capable validators are elected, maintaining the network’s stability and efficiency.

[_I’m confused – take me back to Part I again!_](https://www.genlayer.com/post/what-is-genlayer-the-fundamentals-part-i)

## Conclusion

GenLayer’s GenVM execution environment and Optimistic Democracy consensus mechanism work together seamlessly to bring the power of LLMs to the blockchain. By combining the power of AI with the security and decentralization of blockchain technology, GenLayer opens up new possibilities both for developers and users.

This article explored the engine GenVM, the role of LLM-powered validators, and the Optimistic Execution process that drives the consensus mechanism. Stay tuned for more updates about GenLayer as we dive deeper into undetermined transactions, the appeals process and our vast array of use cases.

**Join us on our mission!**

[Website](https://genlayer.com/) | [Blog](https://www.genlayer.com/blog) | [Discord](https://discord.gg/3SMUG2jKJ6) | [X (prev. Twitter)](https://twitter.com/GenLayer) | [Telegram](https://t.me/genlayer) | [Simulator](https://github.com/yeagerai/genlayer-simulator) | [Docs](https://docs.genlayer.com/) | [Whitepaper](https://www.genlayer.com/whitepaper)