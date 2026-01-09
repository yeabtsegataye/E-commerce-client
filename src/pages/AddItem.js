import React from "react";
import {
  Box,
  Container,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  Heading,
  Text,
  Image,
  useToast,
  Flex,
  Card,
  CardBody,
  Divider,
  RadioGroup,
  Radio,
  Stack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { UseAuthContext } from "../hooks/useAuthContext";
import Usefetch from "../hooks/useGet";
import { useState } from "react";
import { Link } from "react-router-dom";

const AddItem = () => {
  const API_BASE_URL = process.env.REACT_APP_URL;
  const api = `${API_BASE_URL}/ip/cat/allcat`;
  const { data } = Usefetch(api);
  const Category = data?.cats || [];

  const toast = useToast();
  const { user } = UseAuthContext();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    Item_Name: "",
    Item_Description: "",
    Item_Brand: "",
    Item_Category: "",
    Item_Price: "",
    Item_Gender: "male",
    Item_Age: "",
    Item_Status: "available"
  });

  const token = user?.token;

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload JPG, PNG, GIF, or WebP images",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !token) {
      toast({
        title: "Authentication required",
        description: "Please log in to post items",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Image required",
        description: "Please select an image to upload",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }

    // Validate required fields
    const requiredFields = ['Item_Name', 'Item_Description', 'Item_Brand', 'Item_Price', 'Item_Category', 'Item_Age'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("Item_Images", selectedFile);
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      formDataToSend.append("Item_poster", user.id);

      const response = await fetch(`${API_BASE_URL}/ip/item/newitems`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to post item");
      }

      toast({
        title: "Success",
        description: "Item posted successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });

      // Reset form
      setFormData({
        Item_Name: "",
        Item_Description: "",
        Item_Brand: "",
        Item_Category: "",
        Item_Price: "",
        Item_Gender: "male",
        Item_Age: "",
        Item_Status: "available"
      });
      setSelectedFile(null);
      setPreviewImage(null);
      
      // Reset file input
      e.target.reset();
      
    } catch (error) {
      console.error("Post error:", error);
      toast({
        title: "Post failed",
        description: error.message || "An error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="gray.50">
      <Navbar />
      
      <Container maxW="container.lg" flex="1" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Card bg="white" shadow="lg" borderRadius="xl">
            <CardBody>
              <VStack spacing={4} align="center" textAlign="center">
                <Heading size="xl" color="blue.600">
                  Post New Item
                </Heading>
              </VStack>
            </CardBody>
          </Card>

          {/* Form */}
          <Card bg="white" shadow="lg" borderRadius="xl">
            <CardBody>
              <form onSubmit={handleSubmit}>
                <VStack spacing={6}>
                  {/* Item Name & Price */}
                  <Flex direction={{ base: "column", md: "row" }} gap={6} w="100%">
                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Item Name *
                      </FormLabel>
                      <Input
                        name="Item_Name"
                        placeholder="Enter item name"
                        size="lg"
                        value={formData.Item_Name}
                        onChange={handleInputChange}
                        focusBorderColor="blue.500"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Price ($) *
                      </FormLabel>
                      <NumberInput
                        min={0}
                        precision={2}
                        value={formData.Item_Price}
                        onChange={(value) => 
                          setFormData(prev => ({ ...prev, Item_Price: value }))
                        }
                      >
                        <NumberInputField 
                          placeholder="0.00"
                          size="lg"
                          focusBorderColor="blue.500"
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </Flex>

                  {/* Brand & Category */}
                  <Flex direction={{ base: "column", md: "row" }} gap={6} w="100%">
                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Brand *
                      </FormLabel>
                      <Input
                        name="Item_Brand"
                        placeholder="Enter brand name"
                        size="lg"
                        value={formData.Item_Brand}
                        onChange={handleInputChange}
                        focusBorderColor="blue.500"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Category *
                      </FormLabel>
                      <Select
                        name="Item_Category"
                        placeholder="Select category"
                        size="lg"
                        value={formData.Item_Category}
                        onChange={handleInputChange}
                        focusBorderColor="blue.500"
                      >
                        {Category.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.catagory_Name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </Flex>

                  {/* Age & Gender */}
                  <Flex direction={{ base: "column", md: "row" }} gap={6} w="100%">
                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Recommended Age *
                      </FormLabel>
                      <NumberInput
                        min={0}
                        max={100}
                        value={formData.Item_Age}
                        onChange={(value) => 
                          setFormData(prev => ({ ...prev, Item_Age: value }))
                        }
                      >
                        <NumberInputField 
                          placeholder="Enter age"
                          size="lg"
                          focusBorderColor="blue.500"
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Gender *
                      </FormLabel>
                      <RadioGroup 
                        name="Item_Gender"
                        value={formData.Item_Gender}
                        onChange={(value) => 
                          setFormData(prev => ({ ...prev, Item_Gender: value }))
                        }
                      >
                        <Stack direction="row" spacing={6}>
                          <Radio value="male" size="lg" colorScheme="blue">
                            Male
                          </Radio>
                          <Radio value="female" size="lg" colorScheme="pink">
                            Female
                          </Radio>
                          <Radio value="unisex" size="lg" colorScheme="purple">
                            Unisex
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </FormControl>
                  </Flex>

                  {/* Status */}
                  <FormControl>
                    <FormLabel fontWeight="semibold" color="gray.700">
                      Item Status
                    </FormLabel>
                    <Select
                      name="Item_Status"
                      size="lg"
                      value={formData.Item_Status}
                      onChange={handleInputChange}
                      focusBorderColor="blue.500"
                    >
                      <option value="available">Available</option>
                      <option value="sold">Sold</option>
                      <option value="reserved">Reserved</option>
                    </Select>
                  </FormControl>

                  {/* Description */}
                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color="gray.700">
                      Description *
                    </FormLabel>
                    <Textarea
                      name="Item_Description"
                      placeholder="Describe your item in detail..."
                      size="lg"
                      rows={4}
                      value={formData.Item_Description}
                      onChange={handleInputChange}
                      focusBorderColor="blue.500"
                    />
                  </FormControl>

                  {/* Image Upload */}
                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color="gray.700">
                      Item Image *
                    </FormLabel>
                    <VStack spacing={4} align="stretch">
                      <Box
                        border="2px dashed"
                        borderColor="gray.300"
                        borderRadius="lg"
                        p={6}
                        textAlign="center"
                        cursor="pointer"
                        _hover={{ borderColor: "blue.500", bg: "blue.50" }}
                        onClick={() => document.getElementById('fileInput').click()}
                      >
                        <VStack spacing={3}>
                          <Box 
                            as="span" 
                            fontSize="2xl" 
                            color="gray.600"
                          >
                            📤
                          </Box>
                          <Text color="gray.600">
                            Click to upload or drag and drop
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            PNG, JPG, GIF, WebP up to 5MB
                          </Text>
                        </VStack>
                      </Box>
                      <Input
                        id="fileInput"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        display="none"
                      />
                      
                      {previewImage && (
                        <Box mt={4}>
                          <Text fontWeight="semibold" mb={2}>
                            Preview:
                          </Text>
                          <Image
                            src={previewImage}
                            alt="Preview"
                            borderRadius="lg"
                            maxH="300px"
                            objectFit="cover"
                            mx="auto"
                            shadow="md"
                          />
                        </Box>
                      )}
                    </VStack>
                  </FormControl>

                  <Divider />

                  {/* Submit Buttons */}
                  <Flex direction={{ base: "column", sm: "row" }} gap={4} w="100%" justify="space-between">
                    <Button
                      as={Link}
                      to="/"
                      size="lg"
                      variant="outline"
                      colorScheme="gray"
                      w={{ base: "100%", sm: "auto" }}
                      leftIcon={<Box as="span">🏠</Box>}
                    >
                      Go Home
                    </Button>
                    
                    <Button
                      type="submit"
                      size="lg"
                      colorScheme="blue"
                      isLoading={isLoading}
                      loadingText="Posting Item..."
                      w={{ base: "100%", sm: "auto" }}
                      px={8}
                      leftIcon={<Box as="span">✓</Box>}
                    >
                      Post Item
                    </Button>
                  </Flex>
                </VStack>
              </form>
            </CardBody>
          </Card>
        </VStack>
      </Container>
      
      <Footer />
    </Box>
  );
};

export default AddItem;