import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "skinova_token";

export const saveToken = async (token) => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async () => {
  const token = await AsyncStorage.getItem("skinova_token");
  console.log("TOKEN FETCHED:", token);
  return token;
};

export const deleteToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};