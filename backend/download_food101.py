from datasets import load_dataset

print("Downloading Food-101...")
dataset = load_dataset("ethz/food101")
dataset.save_to_disk("datasets/food101")
print("Done!")

