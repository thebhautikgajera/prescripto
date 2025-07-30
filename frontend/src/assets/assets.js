import appointment_img from './appointment_img.png'
import header_img from './header_img.png'
import group_profiles from './group_profiles.png'
import profile_pic from './profile_pic.png'
import contact_image from './contact_image.png'
import about_image from './about_image.png'
import logo from './logo.svg'
import dropdown_icon from './dropdown_icon.svg'
import menu_icon from './menu_icon.svg'
import cross_icon from './cross_icon.png'
import chats_icon from './chats_icon.svg'
import verified_icon from './verified_icon.svg'
import arrow_icon from './arrow_icon.svg'
import info_icon from './info_icon.svg'
import upload_icon from './upload_icon.png'
import stripe_logo from './stripe_logo.png'
import razorpay_logo from './razorpay_logo.png'
import doc1 from './doc1.jpg'
import doc2 from './doc2.jpg'
import doc3 from './doc3.jpg'
import doc4 from './doc4.jpg'
import doc5 from './doc5.jpg'
import doc6 from './doc6.jpg'
import doc7 from './doc7.jpg'
import doc8 from './doc8.jpg'
import doc9 from './doc9.jpg'
import doc10 from './doc10.jpg'
import doc11 from './doc11.jpg'
import doc12 from './doc12.jpg'
import doc13 from './doc13.jpg'
import doc14 from './doc14.jpg'
import doc15 from './doc15.jpg'
import Dermatologist from './Dermatologist.svg'
import Gastroenterologist from './Gastroenterologist.svg'
import General_physician from './General_physician.svg'
import Gynecologist from './Gynecologist.svg'
import Neurologist from './Neurologist.svg'
import Pediatricians from './Pediatricians.svg'


export const assets = {
    appointment_img,
    header_img,
    group_profiles,
    logo,
    chats_icon,
    verified_icon,
    info_icon,
    profile_pic,
    arrow_icon,
    contact_image,
    about_image,
    menu_icon,
    cross_icon,
    dropdown_icon,
    upload_icon,
    stripe_logo,
    razorpay_logo
}

export const specialityData = [
    {
        speciality: 'General Physician',
        image: General_physician,
        slug: 'general-physician-doctors'
    },
    {
        speciality: 'Gynecologist',
        image: Gynecologist,
        slug: 'gynecologist-doctors'
    },
    {
        speciality: 'Dermatologist',
        image: Dermatologist,
        slug: 'dermatologist-doctors'
    },
    {
        speciality: 'Pediatricians',
        image: Pediatricians,
        slug: 'pediatricians-doctors'
    },
    {
        speciality: 'Neurologist',
        image: Neurologist,
        slug: 'neurologist-doctors'
    },
    {
        speciality: 'Gastroenterologist',
        image: Gastroenterologist,
        slug: 'gastroenterologist-doctors'
    },
]

export const doctors = [
    {
        _id: 'doc1',
        name: 'Dr. Rajesh Kumar',
        image: doc1,
        speciality: 'General physician',
        degree: 'MBBS',
        experience: '4 Years',
        about: 'Dr. Kumar is dedicated to providing holistic healthcare with expertise in managing chronic conditions and preventive care. He believes in building long-term relationships with patients and their families to ensure comprehensive wellbeing.',
        fees: 50,
        phone: '+91 98765 43210',
        address: {
            line1: 'Plot No. 17, Sector 4',
            line2: 'Dwarka, New Delhi'
        }
    },
    {
        _id: 'doc2',
        name: 'Dr. Priya Sharma',
        image: doc2,
        speciality: 'Gynecologist',
        degree: 'MBBS',
        experience: '3 Years',
        about: "Dr. Sharma specializes in women's health and reproductive medicine. She is known for her compassionate approach and expertise in handling high-risk pregnancies and gynecological disorders.",
        fees: 60,
        phone: '+91 98765 43211',
        address: {
            line1: 'Plot No. 23, Sector 4',
            line2: 'Dwarka, New Delhi'
        }
    },
    {
        _id: 'doc3',
        name: 'Dr. Ankit Gupta',
        image: doc3,
        speciality: 'Dermatologist',
        degree: 'MBBS',
        experience: '1 Years',
        about: 'Dr. Gupta is passionate about skin health and cosmetic dermatology. He combines traditional remedies with modern treatments to provide comprehensive skincare solutions.',
        fees: 30,
        phone: '+91 98765 43212',
        address: {
            line1: 'Plot No. 31, Sector 4',
            line2: 'Dwarka, New Delhi'
        }
    },
    {
        _id: 'doc4',
        name: 'Dr. Amit Patel',
        image: doc4,
        speciality: 'Pediatricians',
        degree: 'MBBS',
        experience: '2 Years',
        about: 'Dr. Patel has a special way with children and focuses on their overall development along with medical care. He believes in educating parents about preventive healthcare for their children.',
        fees: 40,
        phone: '+91 98765 43213',
        address: {
            line1: 'Plot No. 42, Sector 4',
            line2: 'Dwarka, New Delhi'
        }
    },
    {
        _id: 'doc5',
        name: 'Dr. Meera Reddy',
        image: doc5,
        speciality: 'Neurologist',
        degree: 'MBBS',
        experience: '4 Years',
        about: 'Dr. Reddy is experienced in treating various neurological conditions with a focus on modern therapeutic approaches. She emphasizes patient education and preventive care.',
        fees: 50,
        phone: '+91 98765 43214',
        address: {
            line1: 'Plot No. 55, Sector 4',
            line2: 'Dwarka, New Delhi'
        }
    },
    {
        _id: 'doc6',
        name: 'Dr. Suresh Iyer',
        image: doc6,
        speciality: 'Neurologist',
        degree: 'MBBS',
        experience: '4 Years',
        about: 'Dr. Iyer specializes in neurological disorders and brain health. He is known for his detailed approach to diagnosis and treatment planning for complex neurological conditions.',
        fees: 50,
        phone: '+91 98765 43215',
        address: {
            line1: 'Plot No. 61, Sector 4',
            line2: 'Dwarka, New Delhi'
        }
    },
    {
        _id: 'doc7',
        name: 'Dr. Arun Verma',
        image: doc7,
        speciality: 'General physician',
        degree: 'MBBS',
        experience: '4 Years',
        about: 'Dr. Verma brings extensive experience in general medicine with a focus on lifestyle diseases. He advocates for preventive healthcare and holistic wellness approaches.',
        fees: 50,
        phone: '+91 98765 43216',
        address: {
            line1: 'Plot No. 72, Sector 4',
            line2: 'Dwarka, New Delhi'
        }
    },
    {
        _id: 'doc8',
        name: 'Dr. Kamal Malhotra',
        image: doc8,
        speciality: 'Gynecologist',
        degree: 'MBBS',
        experience: '3 Years',
        about: "Dr. Malhotra is dedicated to women's health and wellness. He specializes in reproductive health and provides comprehensive care for all gynecological concerns.",
        fees: 60,
        phone: '+91 98765 43217',
        address: {
            line1: 'Plot No. 83, Sector 4',
            line2: 'Dwarka, New Delhi'
        }
    },
    {
        _id: 'doc9',
        name: 'Dr. Neha Sinha',
        image: doc9,
        speciality: 'Dermatologist',
        degree: 'MBBS',
        experience: '1 Years',
        about: 'Dr. Sinha specializes in clinical and cosmetic dermatology. She focuses on evidence-based treatments and personalized skincare solutions for her patients.',
        fees: 30,
        phone: '+91 98765 43218',
        address: {
            line1: 'Plot No. 91, Sector 4',
            line2: 'Dwarka, New Delhi'
        }
    },
    {
        _id: 'doc10',
        name: 'Dr. Vikram Mehta',
        image: doc10,
        speciality: 'Pediatricians',
        degree: 'MBBS',
        experience: '2 Years',
        about: 'Dr. Mehta is passionate about child healthcare and development. He ensures a child-friendly approach while providing comprehensive pediatric care.',
        fees: 40,
        phone: '+91 98765 43219',
        address: {
            line1: 'Plot No. 102, Sector 4',
            line2: 'Dwarka, New Delhi'
        }
    },
    {
        _id: 'doc11',
        name: 'Dr. Deepa Krishnan',
        image: doc11,
        speciality: 'Neurologist',
        degree: 'MBBS',
        experience: '4 Years',
        about: 'Dr. Krishnan combines traditional wisdom with modern neurology practices. She specializes in treating various neurological disorders with a patient-centric approach.',
        fees: 50,
        phone: '+91 98765 43220',
        address: {
            line1: 'Plot No. 113, Sector 4',
            line2: 'Dwarka, New Delhi'
        }
    },
    {
        _id: 'doc12',
        name: 'Dr. Rahul Kapoor',
        image: doc12,
        speciality: 'Neurologist',
        degree: 'MBBS',
        experience: '4 Years',
        about: 'Dr. Kapoor is known for his expertise in neurological disorders and stroke management. He emphasizes early intervention and rehabilitation in neurological care.',
        fees: 50,
        phone: '+91 98765 43221',
        address: {
            line1: 'Plot No. 124, Sector 4',
            line2: 'Dwarka, New Delhi'
        }
    },
    {
        _id: 'doc13',
        name: 'Dr. Pooja Agarwal',
        image: doc13,
        speciality: 'General physician',
        degree: 'MBBS',
        experience: '4 Years',
        about: "Dr. Agarwal specializes in women's reproductive health and fertility treatments. She is known for her empathetic approach and comprehensive care.",
        fees: 50,
        phone: '+91 98765 43222',
        address: {
            line1: 'Plot No. 135, Sector 4',
            line2: 'Dwarka, New Delhi'
        }
    },
    {
        _id: 'doc14',
        name: 'Dr. Sanjay Desai',
        image: doc14,
        speciality: 'Gynecologist',
        degree: 'MBBS',
        experience: '3 Years',
        about: "Dr. Desai brings a wealth of experience in general medicine. He focuses on preventive healthcare and managing chronic conditions with a holistic approach.",
        fees: 60,
        phone: '+91 98765 43223',
        address: {
            line1: 'Plot No. 146, Sector 4',
            line2: 'Dwarka, New Delhi'
        }
    },
    {
        _id: 'doc15',
        name: 'Dr. Ritu Chadha',
        image: doc15,
        speciality: 'Dermatologist',
        degree: 'MBBS',
        experience: '1 Years',
        about: 'Dr. Chadha combines modern dermatology with traditional skincare wisdom. She specializes in both medical and cosmetic dermatology treatments.',
        fees: 30,
        phone: '+91 98765 43224',
        address: {
            line1: 'Plot No. 157, Sector 4',
            line2: 'Dwarka, New Delhi'
        }
    },
]