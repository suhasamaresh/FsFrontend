import { Box } from "@0xsequence/design-system";
import { Chain } from "viem";
import ActiveNetwork from "./ActiveNetwork";
import ChainEnvironment from "./ChainEnvironment";
import NativeBalance from "./NativeBalance";

const ChainInfo = (props: { chain: Chain }) => {
  const { chain } = props;
  return (
    <Box marginBottom="8">
      <Box display="flex" justifyContent="space-between">
        <ActiveNetwork chain={chain} />
        <ChainEnvironment chain={chain} />
      </Box>
      <NativeBalance chain={chain} />
    </Box>
  );
};

export default ChainInfo;
