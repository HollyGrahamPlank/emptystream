# Thank you so so much to https://github.com/xserrat/docker-facebook-demucs for help with this.
# This Dockerfile was written using the repo above as a guide.

# Use a CUDA base so that we can maybe take advantage of GPU
FROM nvidia/cuda:11.8.0-base-ubuntu22.04
USER root

ENV TORCH_HOME=/data/models
ENV OMP_NUM_THREADS=1

# The NodeJS version to install
ENV NODE_VERSION=16.13.0

#
#   Setup Python
#

# Install required tools for demucs
# Notes:
#  - build-essential and python3-dev are included for platforms that may need to build some Python packages (e.g., arm64)
#  - torchaudio >= 0.12 now requires ffmpeg on Linux, see https://github.com/facebookresearch/demucs/blob/main/docs/linux.md
RUN apt update && apt install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    git \
    python3 \
    python3-dev \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Clone Demucs into the container
RUN git clone --depth 1 --branch v4.0.0 --single-branch https://github.com/facebookresearch/demucs /lib/demucs
WORKDIR /lib/demucs

# Install required python deps for Demucs
RUN python3 -m pip install -e . --no-cache-dir

# Run Demucs ONCE so that it downloads the default models (and cleanup created split)
RUN python3 -m demucs -d cpu test.mp3
RUN rm -r separated

#
#   Setup NodeJS
#

# Install the desired NodeJS version
# (Yoinked from https://stackoverflow.com/a/57546198 , but updated NVM version)
RUN apt update && apt install -y --no-install-recommends curl
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version

# Copy the TypeScript project into the container, and install it's deps
WORKDIR /usr/app
COPY ./ /usr/app
RUN npm install

#
#   Run!
#

# Enter the container
ENTRYPOINT ["/bin/bash", "--login", "-c"]