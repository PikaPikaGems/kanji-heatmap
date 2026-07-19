import { HeaderBar } from "./HeaderBar";
import { HeaderTitle } from "./HeaderTitle";

const Header = () => {
  return (
    <HeaderBar
      className="fixed top-0 left-0 z-50 backdrop-blur-sm"
      drawerErrorDetails="LazyHeaderDrawer in Header"
    >
      <HeaderTitle />
    </HeaderBar>
  );
};

export default Header;
