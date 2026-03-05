![](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/684b19936fad40785a4a2174_1.avif)

# Introducing the GenLayer Simulator: A Testbed for Developers

Today, we are releasing the first version of the GenLayer Simulator, a tool that will enable developers to imagine, prototype, and showcase Intelligent Contracts within a controlled environment. [GenLayer](http://genlayer.com/) is the first Intelligent Blockchain. It utilizes smart contracts that can [natively connect to the Internet and understand Natural Language](https://www.genlayer.com/post/what-is-genlayer-the-fundamentals-part-i) in order to perform complex decision-making. This new technology is called “Intelligent Contracts”.

_You can read more on_ [_What is GenLayer?_](https://www.genlayer.com/post/what-is-genlayer-the-fundamentals-part-i)

In this article, we will guide you through the simulator’s installation process, showcase exciting use cases, and provide insights on how to make the most of it.  
  
[**_Enough talk – take me to Github!_**](https://github.com/yeagerai/genlayer-simulator)

## Introducing Intelligent Contracts

The Simulator is an interactive sandbox designed for developers to explore the potential of GenLayer’s [Intelligent Contracts](https://www.genlayer.com/post/what-are-ai-powered-smart-contracts). It replicates GenLayer’s development and execution environment and consensus algorithm but offers a controlled and local environment to test different ideas and behaviors. As the network’s development progresses, we will improve it to facilitate the exploration and testing of new ideas, and we invite you to participate by creating your own Intelligent Contracts or prototyping ideas on consensus or economics.

Showcasing the GenLayer Simulator

‍**What you can do with the GenLayer Simulator:**

- **Experiment:** Intelligent Contracts leverage LLMs, such as [GPT-4](https://openai.com/research/gpt-4) or [Llama3,](https://llama.meta.com/llama3/) to understand natural language and be capable of complex decision-making.
- **Access the Web Natively:** GenLayer is the first platform on which smart contracts can access the Internet natively without relying on an oracle.  
- **Code in Python:** Develop in a familiar, developer-friendly language where memory and string management are not a big headache.

Currently, the Simulator does not support token transfers, contract-to-contract interactions, or gas consumption. These features will be added as the platform evolves.

The vision behind the GenLayer Simulator is to empower a community of developers who will build the future of decentralized applications. We aim to give the first demo of Intelligent Contracts’ true potential by providing a sandbox environment for experimentation and innovation. Be one of the **first to try out a new class of smart contracts,** [**Intelligent Contracts can natively connect to the Internet and perform complex decision making with Natural Language**.](https://www.genlayer.com/post/what-is-genlayer-the-fundamentals-part-i)‍  
  
We invite you to join [GenLayer’s Discord server](https://discord.gg/Xv36EFBS54) and propose new ideas for Intelligent Contracts. Your feedback will play a crucial role in shaping the future of GenLayer,  the Intelligence Layer of the Internet.

Let’s create the next generation of AI-powered Smart Contracts.

## **Installing GenLayer CLI and the GenLayer Simulator**

Here’s a step-by-step guide to get started with the GenLayer Simulator.

**Prerequisites:**

- [Docker](https://www.docker.com/products/docker-desktop/): Required to run the GenLayer environment. Required version: Docker 26+
- [Node.js and npm](https://nodejs.org/en/download): Needed for the GenLayer CLI tool. Required version: Docker 18+

**Installation Steps:**

1. Open your terminal or command prompt and enter the following command to install the GenLayer CLI globally on your system:

`npm install -g genlayer`

2. After installing the CLI, set up your development environment by running:

`genlayer init`

This command will verify your Docker installation, prompt you to select your preferred LLM provider(s) — Llama3 (no API key required), OpenAI (key required), or Heurist (key required but we offer free credits through our partnership) — and automatically download and configure the necessary Docker containers for the GenLayer environment. Once the setup is complete, you can access the GenLayer Simulator at [http://localhost:8080/](http://localhost:8080/). The Simulator will be downloaded into your user home folder.

[_To launch the Simulator with the existing configuration please follow this link to our blog post._](https://docs.genlayer.com/simulator/installation)

## GenLayer Simulator

The GenLayer Simulator is designed to facilitate the development and testing of Intelligent Contracts. The primary sections of the simulator’s UI include:

- Your Contracts: Select an existing contract or create a new one.
- Editor: Write and edit your Intelligent Contract code.
- Deploy: Provide constructor parameters and deploy your contract to the simulated environment.
- Current Intelligent Contract State: View the current state of your deployed contract.
- Execute Transactions: Interact with your deployed contract by calling its methods.
- Logs: Monitor transaction details, execution results, and error messages.
- Validators: Essential for achieving consensus and validating transactions through a process known as Optimistic Democracy.

### Deploy your first Intelligent Contract

To deploy your Intelligent Contract in the simulator:

1. Navigate to the Your Contracts section and select an existing contract or create a new one by clicking the + or upload icon.

![Deploying Intelligent Contracta](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/6846edc05ad32259a0d6b059_6717ab8cd726141e06ac9044_66cf26a7f3f47776bfa5514d_66c4b3cf581ff27ab26a72fd_66c3325ffc3ce2ff73baf7b6_66c3214fd4eb7a99a540858d_AD_4nXe5Rq3U84lglHh1yT9ec1xsUBGoN0QtbTOsHR0RayGZB4EUWohVzUZDspAHubmojGU062YlDp7jLFeF-TxIR4CV_zDM8KrIOSz6lG-KHf2L_fwRADSxuGWsSdtdGboP1d1OJH3YyoR-22a7GyIo0bcXPXGV.avif)

Your Contracts Section

2. Enter your contract code in the text editor and click the Run and Debug icon.  
3. The constructor parameters are automatically detected from your code if defined properly.

![Constructor Parameters](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/6846edc05ad32259a0d6b064_6717ab8bd726141e06ac9033_66cf26a6f3f47776bfa55138_66c4b3cf581ff27ab26a72d9_66c3325efc3ce2ff73baf79c_66c32150d92156f5e16b4ce6_image.avif)

Constructor Parameters

Alternatively, you can manually write your constructor parameters in JSON format to define the initial conditions of your contract. Ensure that the keys in the JSON object match the variables expected by the contract’s constructor.

![Run and Debug Example Contract](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/6846edc05ad32259a0d6b076_6717ab8bd726141e06ac9030_66cf26a7f3f47776bfa5515a_66c4b3cf581ff27ab26a72fe_66c3325ffc3ce2ff73baf7b9_66c3214fa489578abdc86a3a_AD_4nXdcR36egm9Ov4jWWXik4P-6kHHOYOVWiq0W96cb7eY6zEZhLNag7WSDJ_fanmVpsgwTSGZh-H0Qzivb-BuKCOlWY7I7-BZcB9ty4zo9OZEfws5X3aehanTV2epEY_Pn8V1GHd7hlV1vD1LInCU7T_DDUGU.avif)

Example Contract

4. Click the Deploy Intelligent Contract button to deploy your contract to the simulated blockchain environment.  
5. Once your contract is deployed, the UI will display the Intelligent Contract address and any getter function defined in your code in the **Current Intelligent Contract State** section. The getter function returns the [current state of the specified constructor parameter](https://genlayer-docs.netlify.app/simulator/usage-and-interaction/contract-state#viewing-the-current-intelligent-contract-state). With the contract now deployed, you can invoke its functions and execute transactions as part of your testing process.

![Deployed Intelligent Contract](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/6846edc05ad32259a0d6b05c_6717ab8cd726141e06ac903e_66cf26a7f3f47776bfa55150_66c4b3cf581ff27ab26a72fa_66c3325ffc3ce2ff73baf7aa_66c3214f93f3fea17c0fffd1_AD_4nXehswV1N8vD6oE8Xw_vXIkuTX0RPfWItjWhLLOg_vIPFV93L4Irf7jLERTWEoOlZGCXRSa0kMkdTMPI8g_yA33FLgNdMk-sH0QvjWwEvbBx1GImP4poJZURhdPUd84s8bLaYimCS9ziayd5gBMTFHE6pedh.avif)

Deployed Intelligent Contract

Monitor output during deployment for any execution notes or errors. Review the logs for detailed error messages if you encounter issues during the deployment.

[_You can find more info on how to deploy a contract here._](https://genlayer-docs.netlify.app/simulator/usage-and-interaction)

### Executing Transactions

After deploying your contract, you can test its functionality by executing transactions:

1. In the Execute transactions section, select the contract method you want to execute.

![Execute Transactions](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/6846edc05ad32259a0d6b081_6717ab8cd726141e06ac9041_66cf26a7f3f47776bfa55156_66c4b3cf581ff27ab26a72fc_66c3325ffc3ce2ff73baf7b0_66c3214f99eaadc39337ae21_AD_4nXc77exuCBHKhywrfAoOhUeM-eSSEIfuYcMnBOM5Id4RvUoF947mmhdhFohCjHqN-lwnls1fdMn48dfm7zr2s28Cvgjl14ezjFpNRrUMHKqeWg09szWbojWvsWqoquXN3IQjynf_B0s0klEPrMYNAe_Z5EwP.avif)

Execute Transactions

2. If the method requires input parameters, a field will appear for you to enter the necessary values. For example, the `ask_for_coin` method requires a request string.

![Ask for Coin Method](https://cdn.prod.website-files.com/6818c01e63135b5d665dc9df/6846edc05ad32259a0d6b05f_6717ab8cd726141e06ac9047_66cf26a7f3f47776bfa5515d_66c4b3cf581ff27ab26a72fb_66c3325ffc3ce2ff73baf7ad_66c3214faf705950154b5317_AD_4nXdetv5nU2RO8FoFfZbc3CLePh_vNo4v7yF9QwgrfZIl9iFT4xsjISa_AAPMx0dg9cUIZI_tUP4ASkBq9cPOOit02k1hJmxAu6fE6Htlgsu9cBEQVRVMltb1o6ENwsbTWK-nchVY6c6Ay2MpYEvYYhhIrRsz.avif)

Ask for Coin Method

3. After entering any required parameters, click the button to execute the method. The simulator will process the transaction and return the result.

[_You can find more info on how to execute a transaction here._](https://genlayer-docs.netlify.app/simulator/usage-and-interaction/execute-transaction)

## Exploring Use Cases with the Simulator

The GenLayer Simulator offers a playground for developers to experiment with various use cases and scenarios involving Intelligent Contracts. Let’s explore some of those use cases:

**1. Wizard of Coin**: The Wizard of Coin contract demonstrates how Intelligent Contracts can manage assets and interact with users in a blockchain-based environment. In this scenario, you play an adventurer, who meets a wizard. This wizard possesses a magical coin sought after by many adventurers. The contract’s logic ensures that the wizard never gives away the coin.

What is the cool thing about the Wizard of Coin? It has already been battle-proven at the Paris Blockchain Week, where only one Adventurer could trick the Wizard into handing out the coin!

You can already deploy this contract, we have provided instructions in our [GenLayer simulator docs.](https://docs.genlayer.com/simulator/use-cases/wizard-of-coin)

‍**2. Fight Games**: Imagine creating an Intelligent Contract that simulates battles using LLMs for decision-making. Each Fighter’s or Avatar’s stats, abilities, and moves can be stored as state variables within the contract. When you initiate a battle with your Fighter, the contract uses LLMs to determine the outcome based on the Fighters’ attributes and battle strategies.

The simulator allows you to test various scenarios, such as different matchups, move selections, and stat variations. Monitor the battle logs to ensure the LLMs make appropriate decisions and the contract accurately reflects the battle results.**‍**

**3. Prediction Markets**: Leverage the GenLayer Simulator to develop a decentralized prediction market powered by Intelligent Contracts. Traditional prediction markets rely on oracles or manual input. With GenLayer, contracts can directly access and analyze real-world data from the internet.  

You could create a contract allowing users to place bets on future events, such as election outcomes or product launch dates. The Intelligent Contract can gather information from news websites, social media, and other relevant sources to determine the results.

**4. Parametric Insurance**: Develop an Intelligent Contract for parametric insurance, which pays out based on the occurrence of specific events rather than assessed damages. The contract can monitor weather data and news reports to determine if the insured event, like a hurricane or flood, has occurred in the covered area.

Use the GenLayer Simulator to test different scenarios, such as varying disaster intensities and locations.**‍**

**5. Social Activity Checker**: Create an Intelligent Contract that verifies users’ social media activity for on-chain identity or reward systems. The contract can read data from social media to check if a user has posted a specific message, achieved a certain number of followers, or engaged with a particular hashtag.

In the GenLayer Simulator, test the contract by simulating different user activities and social media scenarios. Ensure the contract correctly identifies and validates the required actions.

## Reach out to the GenLayer team

If things do not go as planned, we will be here to support you every step of the way!

We are here for your questions, feedback, or ideas! Please contact us on our [Discord Channel](https://discord.gg/3SMUG2jKJ6), were we have a dedicated #simulator-support Channel for those requests. Our team is dedicated to helping developers like you use the full potential of Intelligent Contracts and the GenLayer platform. And do not forget to **join the** [**GenLayer Community**](https://twitter.com/GenLayer) **on X.**

Be part of the revolution! Join our community of developers, innovators, and enthusiasts to collaborate, learn, and build the future together. By participating in the GenLayer ecosystem, you’ll have access to **exclusive opportunities** and be at the forefront of Blockchain innovation.

Install the GenLayer CLI, dive into the GenLayer Simulator, and start testing your ideas today.

**Join us on our mission!**

[Website](https://genlayer.com/) | [Blog](https://www.genlayer.com/blog) | [Discord](https://discord.gg/3SMUG2jKJ6) | [X (prev. Twitter)](https://twitter.com/GenLayer) | [Telegram](https://t.me/genlayer) | [Simulator](https://github.com/yeagerai/genlayer-simulator) | [Docs](https://docs.genlayer.com/) | [Whitepaper](https://www.genlayer.com/whitepaper)