"""Facade module re-exporting all service functions from the `services/` package.
Ensures 100% backward compatibility for all imports from `features.hr_foreign.service`.
"""
from features.hr_foreign.services import *  # noqa: F401, F403
