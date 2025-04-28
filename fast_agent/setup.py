#!/usr/bin/env python3
"""
Setup script for Fast-Agent Server.
This file is only required for backward compatibility.
For modern Python projects, we recommend using pyproject.toml with uv.
"""

from setuptools import setup, find_packages

setup(
    name="fast-agent",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.103.0",
        "uvicorn>=0.23.2",
        "websockets>=11.0.3",
        "pydantic>=2.3.0"
    ],
)