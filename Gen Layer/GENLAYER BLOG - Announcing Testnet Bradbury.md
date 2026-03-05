![](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/69651c734d52d2121f69688c_Untitled%20design%20\(1\).png)

# Announcing Testnet Bradbury

In our last article we touched on Testnet Bradbury, our next milestone towards Mainnet. Here I invite you to join me for an in-depth exploration of our vision for Bradbury, drilling down into the goals and experiments we want to run.

_Bradbury is where AI meets Blockchain Consensus_ for the first time. During Asimov we laid the infrastructure foundations, and connected all different parts of the system; in Bradbury we are ready to add the final ingredient: LLM inference.

Until now our validators have been using subsidized LLMs from our Inference Partners [@ionet](https://x.com/@ionet), [@heurist_ai](https://x.com/@heurist_ai) / [@Libertai_DAI](https://x.com/@Libertai_DAI), and [@comput3ai](https://x.com/@comput3ai) who are supporting our Validators with free credits during Testnet. As we were not running real "production" contracts on Asimov, each Validator's LLM choice was trivial. All the focus in Bradbury shifts towards this decision: how to choose an appropriate model and how to get the best performance out of GenLayer.

I previously defined Testnet Bradbury as a scholar's gym where research and experiments coexist trying to achieve the best performance. I think this captures the gist of what we envision happening in Bradbury.

With Bradbury we are transitioning from a passive Testnet Asimov to active and engaged Testnet Bradbury where Partners, Validators, Builders and Researchers will switch to a more active role.

Our inference partners will have a much more prominent role, interacting with Validators, understanding how each model performs on GenLayer and providing alternative models. They are experts in this regard and their contributions will be most valuable.

For Validators, GenLayer adds a new layer of opportunity to explore. The Optimistic Democracy consensus leaves behind the well-traversed path and takes a turn into uncharted territory, by introducing non-determinism. The biggest objective of Bradbury is for the Validators to learn and engage with the rapid updates of the AI world to keep GenLayer working as well as possible and thereby maximise their own rewards. We will be conducting a small workshop for Validators to deploy their own Intelligent Contracts to understand the builder’s point of view.

Builders can start deploying their apps in Bradbury and compare the execution there against the Studio, helping us fine-tune the system. We won't be running production apps in Bradbury as its performance will vary and history will be reset from time to time, but it will be an opportunity for  projects like Rally, Unstoppable or GenLayer Playverse's games to deploy their real contracts in the Bradbury testnet and measure their performance with historic transactions: benchmarking real production use cases in a decentralized network .

Let's now dive deep into several areas of research and experimentation.

## Greyboxing

[Greyboxing](https://docs.genlayer.com/_temp/security-and-best-practices/grey-boxing) is a unique capability of GenLayer validators. It gives them the ability to apply arbitrary transformations before each LLM call. Any input/context can be captured, analyzed, modified and decisions can be taken before prompting the LLMs.

This opens up a huge range of possibilities for validators to improve performance, reduce costs and harden security.

## Model Routing

Validators are not tied to just one LLM model. They can use different LLMs for different contracts. Let's say we are running a contract thousands of times per day. It would make sense for validators to fine-tune/distill a smaller model on all the input-output pairs they have so they end up with a cheaper, faster and more performant model than their default one.

In the opposite case, if a Validator is part of a big Appeal with 1000 Validators, it would make sense to run the most powerful model at their disposal to try and produce the most accurate decision which has the highest likelihood to agree with the majority, hence getting a reward instead of being in the minority and incurring a penalty.

We call this model routing, and it's an open area of research. Validators need cost-saving routers for different contract complexities; those excelling in model routing will get more rewards and will move GenLayer forward. We encourage independent routing development to gain a competitive advantage.

## Universal Prompt Injection

Prompt Injection is a known vulnerability of LLMs. Barring a big update on the underlying structure of Transformers, this family of attacks is here to stay. Optimistic Democracy helps a lot in this regard, because you need to successfully attack not one model, but the majority of the LLMs participating in the consensus giving an extra layer of protection for free.

This is not enough as Universal Prompt Injection attacks have been found in the past (and might again in the future) which successfully break all LLMs. To mitigate this (and other kinds of attacks) each node can check the prompts/inputs of the contract before calling the LLM and apply filters which make such attacks exponentially more difficult. As the release cadence of models is slow, Validators are the ones who can keep GenLayer secure.

## GenLayer Constitution

As part of our governance roadmap we will define a GenLayer Constitution, agreed by the whole ecosystem where we can decide what kind of transactions we want to execute in GenLayer and which ones we would like to ban. An open dialog throughout the Ecosystem will take place to jointly agree and write our Constitution.

During the greyboxing step, any Validator can check for infringements of the Constitution and decide not to process a transaction.

## Benchmarks

To perform and iterate over all the previous ideas, we need a baseline so we can actually measure and find out what improves the performance. We will need _benchmarks_ in the form of Intelligent Contracts and datasets that define a transaction and the final state of the contract. This way, after each modification we can run the benchmarks and figure out the impact of said change.

Some of these benchmarks will be discrete, for example using the [LLM ERC-20 contract](https://github.com/genlayerlabs/genlayer-studio/blob/main/examples/contracts/llm_erc20.py) that clearly defines an expected output state based on each input. Some others can rely on checking the outputs with LLMs for certain properties, or just running production traffic from dApps already running in the Studio (Intelligent Oracle, Rally, Unstoppable, etc.) to a "shadow" running dApp on Bradbury and calculating the deviation.

As the core team and many Validators will be constantly experimenting with their setup we expect to run these benchmarks periodically to have the history of the evolution of Bradbury. This is what we call the Bradbury Gym which most likely will be integrated with the [Points System](https://points.genlayer.foundation/).

With these benchmarks we can test performance across different model types and determine which contracts work with cheaper vs frontier models.

## Gas & Fees

GenLayer has a novel Rewards/Penalties system which is based on how each Validator votes and if it's in the majority or minority. The core team is finalizing the implementation of this feature right now and once implemented it will give the Validators an incentive and a feedback mechanism they need to tune their nodes and perform a cost analysis.

We want to test our initial assumptions and simulations against real usage in the Testnet and adjust system constants accordingly. For example, we estimated that by paying 60x - 100x the cost of inference per transaction as gas to the Validators, it makes no economic sense for a Validator to be lazy (always accepting the Leader's response).

We want to empirically test this hypothesis and set up the tools needed to constantly test this during Mainnet as we will need to adjust these constants when new frontier models appear and inference price drops during GenLayer's continued operation.

## Model Diversity

Optimistic Democracy benefits from Model Diversity, i.e., different LLMs, different initial config (seed, temperature, etc.) or different training checkpoints that provides us with enough reduced correlation (independence) so the consensus converges to the correct answers.

We are currently defining the mathematical foundations so we can perform empirical tests and benchmarks on Bradbury with real world use cases to measure the impact of model correlation. We aim to experiment and provide a default set of configs that helps us achieve the best results. A GenLayer CLI setup wizard can be created to help Validators set up their nodes according to the found best practices.

We need to create the appropriate framework for diversity to emerge among validators. Luckily we have many tools at our disposal like the GenLayer Foundation rewarding least used models and subsidizing specific configurations.

We need to work on a self-reporting mechanism with per-transaction metadata.

## Appeals

An open area of research is the Appealing mechanism of the Optimistic Democracy consensus. Being an optimistic algorithm it means that it starts "cheap" without consuming many resources, i.e. we start with 5 validators with the possibility to go up to 1000. A successful appealer is rewarded for their efforts. This means there's an opportunity for rewards by quickly appealing when the answer might not be correct. This is a yet practically unexplored role inside GenLayer.

An appealer has at its disposal all the historic data of the validators, which validators participated in the current round, the contract itself and all the transaction data. All this information can be used to evaluate each transaction and decide if it's worth pursuing further analysis that might end in a successful appeal. When a transaction is flagged as suspicious an appealer might run a state-of-the-art model off-chain (much cheaper), figure out the expected vote and decide to appeal or not.

There are multiple strategies possible here, like statistical analysis, classic ML algorithms, greedy appeals on minority voting and many others. The appealers can be the validators themselves (they have access to all the data in real time) or a bot monitoring the network. We are still not sure which technical implementation will be used.

## Community Engagement

Last but not least we are ideating some community activations via gamification such as trying to break the [Wizard of Coin contract](https://github.com/genlayerlabs/genlayer-studio/blob/main/examples/contracts/wizard_of_coin.py) during Bradbury.

We are also crafting challenges for researchers to compete, improving the overall performance and knowledge about GenLayer.

## Final words

Testnet Bradbury is a sandbox for everyone to test their most exciting theories for pushing GenLayer forward. It's important to note that for the success of Bradbury we will need active participation and engagement from all the actors involved in GenLayer: Validators, Builders, Researchers and Community Members. We have some ideas on how to incentivise this which we will share in upcoming communications.

This is a pretty technical article with lots of information to digest. There are a lot of open areas to explore. We've been working on these ideas for years now and we wanted to give you a glimpse of what's coming. We are really excited to see Testnet Bradbury finally coming to fruition and sharing it with you.

If you are interested in participating in GenLayer and Testnet Bradbury please join our [Points System](https://points.genlayer.foundation/).