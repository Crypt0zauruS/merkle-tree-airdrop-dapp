"use client";
import { Alert, AlertIcon } from "@chakra-ui/react";

const NotConnected = () => {
  return (
    <Alert status="warning">
      <AlertIcon />
      Please connect your wallet
    </Alert>
  );
};

export default NotConnected;
