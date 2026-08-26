export type StkCallbackMetadataItem = {
  Name: string;
  Value?: string | number;
};

export type StkCallbackBody = {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number | string;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: StkCallbackMetadataItem[];
      };
    };
  };
};
