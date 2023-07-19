# emptystream
<p align="center"><img src="docs/images/logo.png" height="256"></p>


> Who would I be to describe myself as a part-time nocturnal Flâneur if I didn’t use my observations and reflections to create an art piece?

In 2020 I scrapped together `emptystream`, a piece of [net art](https://en.wikipedia.org/wiki/Internet_art) sparked by my brief college studies on coffeehouse culture and inspired by my experiences drifting through the city at night. `emptystream` pairs bitcrushed gifs with heavily compressed ambient audio to produce an endless & synchronized emulated walk through imaginary space. It is designed to allow the viewer to exist in new spaces constructed from the scraps of existing ones.

This repository is a re-write of the `emptystream`, designed to leverage the [Serverless Framework](https://www.serverless.com/) for ease of development and easy hosting.

# Plan
I am currently actively developing this project as a portfolio piece! My plan is to architect and write it over a few passes, demonstrating my knowledge in backend development as well as cloud engineering.

Once this project is finished, I would like to port it to a few different languages - just to show that this understanding is language agnostic. Maybe I'll even use other cloud providers? Not sure yet.

~ Holly


# Architecture
![emptystream's cloud architecture. It uses AWS CloudFront as a CDN with static content hosted in S3. AWS API Gateway directs HTTP requests to three services: the Song Management service, the Admin Panel service, and the Content Stream service. This services use AWS Lambda, DynamoDB, Fargate, EventBridge, and Systems Manager ParameterStore in order to function.](docs/images/cloud_design.svg)