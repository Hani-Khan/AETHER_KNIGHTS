import React from 'react'
import { PageHOC} from '../components';

const TradeCard = () => {
  return (
  <div>
    Trade Card Page
  </div>
  )
}

// export default PageHOC
export default PageHOC(
  TradeCard,
  <>Welcome to AETHER KNIGHTS <br /> MarketPLace </>,
  <>Here You Can Trade Your Cards <br /> To Turn The Tables </>
);
