

interface Topbarprops {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Topbar: React.FC<Topbarprops> = ({isOpen, setIsOpen}) => {
    return(
        <div className="flex flex-row justify-between">
            <div>
                <p>khdkasd</p>
            </div>

            <div>
                <p>hgdajda</p>
            </div>

        </div>
    )
}

export default Topbar;