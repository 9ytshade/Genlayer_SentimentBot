![](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/684b1b6286fce343764a1319_16.avif)

# Optimistic Execution Agreeing on the Unagreeable

Is the Mona Lisa the most beautiful painting in the world? Is this blog post the best ever written? These questions, much like many others we encounter daily, are subjective. Opinions on such matters can vary greatly from person to person, making it challenging to reach a consensus.

This subjectivity can not be processed in blockchains because they only process so called deterministic transactions. On the other hand, subjective questions are non-deterministic, which means that you can receive a different output even for the same input.

![](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/6846edc4bb1bef83bcc79f26_66d87c5b879d2630ddc335d0_66d87bee8e3dc34643d10e69_Optimistic%252520Execution%252520Agreeing%252520on%252520the%252520Unagreeable%252520-%252520Graphic%2525201%252520\(2\).avif)

Subjectivity and Non-Determinism

Your **everyday blockchain just can’t answer whether the Mona Lisa is the most beautiful painting in the world.** Also, it can not handle any other non-deterministic scenario, such as reading data from an ever-changing source like the World Wide Web. You need a new kind of blockchain to get the job done!

Can [GenLayer](http://genlayer.com/) solve this non-deterministic problem? First off, how do we get to this “problem”?  
_(Spoiler: It can)_

## The Optimistic Approach: Balancing Efficiency and Reliability

Let’s look at the non-deterministic or “subjective problem“ from the perspective of GenLayer and remember what we know so far. GenLayer consists of many validators, each with some staked GEN tokens and access to a Large Language Model.

[_Learn more about the consensus mechanism amongst validators in GenLayer._](https://www.genlayer.com/post/what-is-genlayer-the-fundamentals-part-ii)

![](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/6846edc0c755294649baeb84_66d87a7beb52e3a8fabafb42_66d8658e9a897eb6af73a6af_What%252520is%252520GenLayer%252520%25255BThe%252520Fundamentals-Part%252520II%25255D%252520graphic%2525201%252520\(1\).avif)

Interplay Leader and Validators

GenLayer’s approach to transaction validation is optimistic, meaning that not every validator is required to validate every transaction. By default, a randomly selected group of five validators is assigned to verify each transaction. However, developers in [GenLayer](http://genlayer.com/) are the ones making the magic work. They can increase the minimum number of validators they want for their specific project, allowing them to achieve higher security guarantees while increasing the cost of transactions.

This optimistic approach enables efficient processing of transactions, as only a small subset of validators is needed to reach consensus. But how can they actually come to an agreement about non-deterministic transactions?

### Solving Non-Determinism with Equivalence

At the heart of [GenLayer’s consensus mechanism lies the Equivalence Principle](https://www.genlayer.com/post/what-is-genlayer-the-fundamentals-part-ii). This principle is essential for dealing with the non-deterministic nature of LLM-based transactions.

Let’s revisit the subjective (and non-deterministic) question from the introduction: Is the Mona Lisa the most beautiful painting in the world? When posed to different LLMs, this question may lead to various answers, each with its own justification.

- Yes, because the colors align perfectly.
- Yes, because the Mona Lisa has the most beautiful smile.
- No, Van Gogh’s Starry Night is more beautiful.

How to find consensus without determining what is considered equal in such a constellation?

**As always, in** [**GenLayer**](https://genlayer.com/)**, we empower the builders in their decisions:** The Equivalence Principle allows them to define what constitutes an acceptable answer for their specific use case.

![](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/6846edc4bb1bef83bcc79f1b_66d87c5b879d2630ddc335d6_66d87c2fb46a1b6ce2ed11e3_Optimistic%252520Execution%252520Agreeing%252520on%252520the%252520Unagreeable%252520-%252520Graphic%2525203%252520\(2\).avif)

Scale Symbolizing Equivalence

For example, consider a parametric insurance platform built on GenLayer that pays out claims based on real-world events. The developer may set the equivalence principle to accept answers from validators searching various news sources to be considered equivalent in case they agree on the event of a hurricane happening. One Validator’s answer, “yes, there is a hurricane”, could be considered equivalent to another Valdidator’s answer, “yes, a hurricane is making landfall.”

This is a minor, but important difference. As you eventually already know you could build a parametric insurance platform on GenLayer, which pays policyholders out based on the occurance of a catastrophe. Whether a hurricane caused landfall or not, could be a very important detail.

[_Learn more about what is considered equivalent in GenLayer._](https://www.genlayer.com/post/what-is-genlayer-the-fundamentals-part-ii)

## **The Consensus Mechanism: Validating the Leader’s Proposal**

When a transaction is submitted to the network, one of the selected validators is chosen as the leader. The leader executes the transaction and proposes an output, which the other validators then evaluate using the Equivalence Principles set by the developer. **Reaching a consensus within the determined equivalence principle is guaranteed, as the number of validators is always odd.**

Each validator independently processes the transaction, comparing their outputs for each non-deterministic call to the leader’s proposals. If a majority of the validators agree with the leader’s outputs, the transaction is considered valid. This process ensures that even though the outputs may not be identical, they are equivalent within the context of the project’s requirements.

### The Appeal Process: Taking it to the Supreme Court

As the number of validators is always odd, the transaction can usually be agreed on regardless of how many validators are randomly required for consensus. There is still the possibility of undetermined transactions, which we will cover in another blog post.

Anyone who disagrees with the initial validator set’s decision, can submit an appeal request during the Finality Window. The Finality window is the duration after submitting a transaction during which it is possible to submit an appeal request for a transaction. With every new appeal, the Finality Window is redetermined again.

![](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/6846edc4bb1bef83bcc79f23_66d87c5b879d2630ddc335d3_66d87c474e928ef74c41870a_Optimistic%252520Execution%252520Agreeing%252520on%252520the%252520Unagreeable%252520-%252520Graphic%2525204%252520\(2\).avif)

Appeal Process

Each appeal involves a larger set of validators re-evaluating the transaction. In the standard case, which includes a minimum of five validators, the validator set would be increased to 11. A new leader gets chosen and the non-leader validators are doubled.

This process continues until a consensus is reached or all validators have participated. **It’s worth noting that a user can pay the gas cost upfront so all validators can agree on this specific transaction if they want to ensure high reliability.** The whole process of appeals is comparable to a court system in which one can also appeal decisions upon reaching the final instance — f.i. The Supreme Court. Comparable to including all validators to agree on a transaction right from the beginning, a person whose constitutional rights have been violated can appeal to the Supreme Court directly.

Anyone can initiate an appeal by providing additional GEN tokens to cover the gas costs. This open appeal system ensures the system can self-correct. This can be compared to the role of an appellant in a court system, who must cover the costs of the appeal process to have their case heard by a higher authority.

### Balancing Finality and Throughput

GenLayer’s primary focus is not on competing with other blockchains regarding transaction speed or throughput. Instead, the platform prioritizes precision and reliability, much like a court system that values justice over efficiency.

Transactions on [GenLayer](http://genlayer.com/) are considered final once the appeal window has passed without any challenges. This finality window allows sufficient time for stakeholders to review the transaction and raise concerns if necessary. For instance, in the parametric insurance example, the finality window would allow interested parties to challenge the hurricane landfall claim before the payouts take place.

While this approach may result in longer finality times than other networks, it ensures that every transaction undergoes a rigorous validation process. The throughput and latency of the network are balanced against the need for accuracy and security.

## Finding Consensus in a Subjective World

[GenLayer’s Optimistic Execution model](https://www.genlayer.com/post/what-is-genlayer-the-fundamentals-part-i), powered by the Equivalence Principle and the appeal process, offers a robust solution **for reaching consensus on subjective and non-deterministic transactions.** By allowing developers to define what constitutes an acceptable outcome for their specific use case, GenLayer enables a wide range of previously impossible applications on traditional blockchain platforms.

As we navigate an increasingly subjective world, GenLayer provides the tools and framework needed to build reliable, trustless systems that can handle the challenges of non-determinism.

**Join us on our mission!**

[Website](https://genlayer.com/) | [Blog](https://www.genlayer.com/blog) | [Discord](https://discord.gg/3SMUG2jKJ6) | [X (prev. Twitter)](https://twitter.com/GenLayer) | [Telegram](https://t.me/genlayer) | [Simulator](https://github.com/yeagerai/genlayer-simulator) | [Docs](https://docs.genlayer.com/) | [Whitepaper](https://www.genlayer.com/whitepaper)