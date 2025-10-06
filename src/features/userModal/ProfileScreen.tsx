import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import Stack from '@mui/material/Stack';
import OurWordmark from '../../components/OurWordmark';
import XButton from '../../components/XButton';
import {useIsMobile} from '../../hooks/useIsMobile';
import {useOscarAppContext} from '../../providers/AppContext';
import SignUp from './SignupForm';
import UserProfile from './UserProfile';

type Props = {
  open: boolean;
  // setOpen: (open: boolean) => void;
  closeModal: () => void;
};

function ProfileScreenContents({closeModal}: {closeModal: () => void}) {
  const {activeUserId} = useOscarAppContext();
  if (!activeUserId) {
    return <SignUp closer={closeModal} />;
  } else {
    return <UserProfile closer={closeModal} />;
  }
}

export default function ProfileScreen({open, closeModal}: Props) {
  const isMobile = useIsMobile();
  return (
    <Dialog
      fullScreen={isMobile}
      onClose={closeModal}
      open={open}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'background',
          borderRadius: isMobile ? '0' : '2ch',
        },
      }}>
      <Card
        color="primary"
        sx={{
          borderRadius: isMobile ? '0' : '2ch',
          padding: '12px',
          height: '100%',
        }}
        variant="outlined">
        <Stack alignItems="center" gap={4}>
          <XButton onClick={closeModal} />
          <OurWordmark />
          {/* <Divider /> */}
          <ProfileScreenContents closeModal={closeModal} />
        </Stack>
      </Card>
    </Dialog>
  );
}
