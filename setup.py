from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in razorpay_payment_links_integration/__init__.py
from razorpay_payment_links_integration import __version__ as version

setup(
	name="razorpay_payment_links_integration",
	version=version,
	description="A frappe app for Razorpay Payment Links Integration",
	author="Sameer Chauhan",
	author_email="sameer@extensioncrm.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
