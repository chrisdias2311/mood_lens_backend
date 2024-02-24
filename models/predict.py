# import numpy as np
# from keras.models import model_from_json
# from keras.preprocessing import image
# import requests
# from PIL import Image
# from io import BytesIO
# import sys


# # Load the pre-trained model from the .json and .h5 files
# with open('models/emotion_model.json', 'r') as f:
#     model = model_from_json(f.read())
# model.load_weights('models/emotion_model.h5')

# emotion_dict = {0: "Angry", 1: "Disgusted", 2: "Fearful", 3: "Happy", 4: "Neutral", 5: "Sad", 6: "Surprised"}

# # Define a function to preprocess the input image
# def preprocess_image(image):
#     # Resize the image to the input size of the model (e.g. 48 x 48)
#     image = image.resize((48, 48))
#     # Convert the image to grayscale
#     image = image.convert('L')
#     # Convert the image to a numpy array and scale the pixel values to [0, 1]
#     image_array = np.array(image) / 255.0
#     # Add an extra dimension to the array to represent a batch of size 1
#     batch = np.expand_dims(image_array, axis=0)
#     # Add an extra dimension to the array to represent a grayscale image
#     batch = np.expand_dims(batch, axis=3)
#     # Return the preprocessed batch
#     return batch

# def predict(image_url):
#     # Download the image from the URL
#     # print("Reached here")
#     response = requests.get(image_url)
#     image = Image.open(BytesIO(response.content))

#     # Preprocess the image
#     image_batch = preprocess_image(image)

#     # Use the model to predict the emotion
#     predictions = model.predict(image_batch)
#     emotion = np.argmax(predictions)

#     # Return the predicted emotion
#     print(emotion_dict[emotion])
#     return emotion_dict[emotion]

# if __name__ == '__main__':
#     image_url = sys.argv[1]  # Get the image URL from the command-line arguments
#     print(predict(image_url))  # Call the predict function and print the result


# print(predict("https://firebasestorage.googleapis.com/v0/b/portal-8d197.appspot.com/o/onboard_hospital%2F-Ngy86nBlGlvPH5eODNh%2F1698142014810_watch1.jpg?alt=media&token=f2b6299f-ec82-4671-870d-dea3e4ad4340"))

import subprocess

# List of required modules
required_modules = ['numpy', 'keras', 'PIL', 'requests']

# Install required modules if not already installed
for module in required_modules:
    try:
        __import__(module)
    except ImportError:
        subprocess.check_call(["pip", "install", module])

# Import required modules after installation
import numpy as np
from keras.models import model_from_json
from keras.preprocessing import image
import requests
from PIL import Image
from io import BytesIO
import sys

# Load the pre-trained model from the .json and .h5 files
with open('models/emotion_model.json', 'r') as f:
    model = model_from_json(f.read())
model.load_weights('models/emotion_model.h5')

emotion_dict = {0: "Angry", 1: "Disgusted", 2: "Fearful", 3: "Happy", 4: "Neutral", 5: "Sad", 6: "Surprised"}

# Define a function to preprocess the input image
def preprocess_image(image):
    # Resize the image to the input size of the model (e.g. 48 x 48)
    image = image.resize((48, 48))
    # Convert the image to grayscale
    image = image.convert('L')
    # Convert the image to a numpy array and scale the pixel values to [0, 1]
    image_array = np.array(image) / 255.0
    # Add an extra dimension to the array to represent a batch of size 1
    batch = np.expand_dims(image_array, axis=0)
    # Add an extra dimension to the array to represent a grayscale image
    batch = np.expand_dims(batch, axis=3)
    # Return the preprocessed batch
    return batch

def predict(image_url):
    # Download the image from the URL
    response = requests.get(image_url)
    image = Image.open(BytesIO(response.content))

    # Preprocess the image
    image_batch = preprocess_image(image)

    # Use the model to predict the emotion
    predictions = model.predict(image_batch)
    emotion = np.argmax(predictions)

    # Return the predicted emotion
    print(emotion_dict[emotion])
    return emotion_dict[emotion]

if __name__ == '__main__':
    image_url = sys.argv[1]  # Get the image URL from the command-line arguments
    print(predict(image_url))  # Call the predict function and print the result
